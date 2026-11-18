import { useState, useEffect } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
  addDoc,
  arrayUnion,
  arrayRemove,
  deleteField
} from 'firebase/firestore';
import { db } from '../firebase';
import { isProfileComplete } from '../utils/dietEngine';

const DEFAULT_USER_DOC = {
  profile: null,
  selected: { breakfast: 1, secondBreakfast: 1, lunch: 1, dinner: 1 },
  days: 3,
  checkedItems: {},
  manualMembers: [],
  linkedMemberIds: [],
  activeMemberIds: [],
  memberSyncPrefs: {},
  sharedWith: [],
  familyHost: null,
  allowHostMenuSync: false
};

export function useFamilySync(user) {
  const [userDoc, setUserDoc] = useState(null);
  const [docLoading, setDocLoading] = useState(true);

  const [incomingInvite, setIncomingInvite] = useState(null);
  const [inviteAllowMenuSync, setInviteAllowMenuSync] = useState(true);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [linkedMembers, setLinkedMembers] = useState([]);

  // 1. Подписка на личный документ пользователя в Firestore
  useEffect(() => {
    if (!user) {
      setUserDoc(null);
      setDocLoading(false);
      return;
    }
    setDocLoading(true);
    const userRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          setUserDoc(snap.data());
        } else {
          setUserDoc(DEFAULT_USER_DOC);
        }
        setDocLoading(false);
      },
      (err) => {
        console.error('Firestore snapshot error:', err);
        setDocLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

  // 2. Проверка параметра ?invite=... в URL при входе по ссылке
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const inviteId = params.get('invite');
    if (!inviteId) return;

    const loadInvite = async () => {
      try {
        const invSnap = await getDoc(doc(db, 'invites', inviteId));
        if (invSnap.exists()) {
          const data = invSnap.data();
          if (data.fromUid !== user.uid && data.status === 'pending') {
            setIncomingInvite({ id: invSnap.id, ...data });
            setInviteAllowMenuSync(true);
          }
        }
      } catch (err) {
        console.error('Ошибка проверки приглашения:', err);
      }
    };
    loadInvite();
  }, [user]);

  // 3. Подписка на входящие запросы доступа
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'invites'),
      where('toUid', '==', user.uid),
      where('status', '==', 'pending')
    );
    const unsub = onSnapshot(q, (snap) => {
      setPendingRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  // 4. Подписка на профили подключенных членов семьи
  useEffect(() => {
    const ids = userDoc?.linkedMemberIds || [];
    const prefs = userDoc?.memberSyncPrefs || {};
    if (!user || ids.length === 0) {
      setLinkedMembers([]);
      return;
    }
    const unsubs = ids.map((memberUid) =>
      onSnapshot(
        doc(db, 'users', memberUid),
        (snap) => {
          if (snap.exists() && isProfileComplete(snap.data().profile)) {
            const memberData = snap.data();
            const memberPref = prefs[memberUid] || { useMemberMeals: false, pushMyMenu: false };
            setLinkedMembers((prev) => {
              const filtered = prev.filter((item) => item.id !== memberUid);
              return [
                ...filtered,
                {
                  id: memberUid,
                  type: 'linked',
                  profile: memberData.profile,
                  memberSelected: memberData.selected || {},
                  selected: memberPref.useMemberMeals
                    ? (memberData.selected || {})
                    : (userDoc.selected || {}),
                  allowHostMenuSync: Boolean(memberData.allowHostMenuSync),
                  useMemberMeals: Boolean(memberPref.useMemberMeals),
                  pushMyMenu: Boolean(memberPref.pushMyMenu)
                }
              ];
            });
          }
        },
        () => {
          setLinkedMembers((prev) => prev.filter((item) => item.id !== memberUid));
        }
      )
    );
    return () => unsubs.forEach((u) => u());
  }, [user, userDoc?.linkedMemberIds, userDoc?.memberSyncPrefs, userDoc?.selected]);

  // Сохранение изменений в свой профиль + трансляция меню тем, у кого включен pushMyMenu
  const saveUserPatch = async (patch) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const nextData = { ...(userDoc || {}), ...patch };
    setUserDoc(nextData);

    const snap = await getDoc(userRef);
    if (snap.exists()) {
      await updateDoc(userRef, patch);
    } else {
      await setDoc(userRef, {
        ...DEFAULT_USER_DOC,
        ...patch
      });
    }

    if (patch.selected) {
      const prefs = nextData.memberSyncPrefs || {};
      for (const m of linkedMembers) {
        if (prefs[m.id]?.pushMyMenu && m.allowHostMenuSync) {
          try {
            await updateDoc(doc(db, 'users', m.id), {
              selected: patch.selected
            });
          } catch (err) {
            console.error(`Не удалось синхронизировать меню для ${m.profile?.name}:`, err);
          }
        }
      }
    }
  };

  // Изменение настроек синхронизации для конкретного члена семьи
  const handleUpdateMemberSyncPref = async (memberUid, key, value) => {
    if (!user) return;
    const currentPrefs = userDoc?.memberSyncPrefs || {};
    const memberPref = currentPrefs[memberUid] || { useMemberMeals: false, pushMyMenu: false };
    const nextPrefs = {
      ...currentPrefs,
      [memberUid]: { ...memberPref, [key]: value }
    };
    await saveUserPatch({ memberSyncPrefs: nextPrefs });

    if (key === 'pushMyMenu' && value === true) {
      const target = linkedMembers.find((m) => m.id === memberUid);
      if (target?.allowHostMenuSync && userDoc?.selected) {
        try {
          await updateDoc(doc(db, 'users', memberUid), {
            selected: userDoc.selected
          });
        } catch (err) {
          console.error('Ошибка первичной синхронизации меню:', err);
        }
      }
    }
  };

  // Принятие или отклонение приглашения
  const handleRespondToInvite = async (inviteObj, approve, allowSyncFlag = true) => {
    if (!user || !inviteObj) return;
    try {
      await updateDoc(doc(db, 'invites', inviteObj.id), {
        status: approve ? 'accepted' : 'declined',
        toUid: user.uid,
        toName: userDoc?.profile?.name || user.displayName || 'Член семьи'
      });

      if (approve) {
        await setDoc(
          doc(db, 'users', user.uid),
          {
            sharedWith: arrayUnion(inviteObj.fromUid),
            familyHost: {
              uid: inviteObj.fromUid,
              name: inviteObj.fromName || 'Глава семьи',
              email: inviteObj.fromEmail || ''
            },
            allowHostMenuSync: Boolean(allowSyncFlag)
          },
          { merge: true }
        );
        await updateDoc(doc(db, 'users', inviteObj.fromUid), {
          linkedMemberIds: arrayUnion(user.uid),
          activeMemberIds: arrayUnion(user.uid),
          [`memberSyncPrefs.${user.uid}`]: {
            useMemberMeals: false,
            pushMyMenu: Boolean(allowSyncFlag)
          }
        });
      }
      setIncomingInvite(null);
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      console.error('Ошибка обработки приглашения:', err);
    }
  };

  // Удаление члена семьи главой семьи
  const handleRemoveLinkedMember = async (memberUid) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        linkedMemberIds: arrayRemove(memberUid),
        activeMemberIds: arrayRemove(memberUid),
        [`memberSyncPrefs.${memberUid}`]: deleteField()
      });
      await updateDoc(doc(db, 'users', memberUid), {
        familyHost: null,
        allowHostMenuSync: false,
        sharedWith: arrayRemove(user.uid)
      });
    } catch (err) {
      console.error('Ошибка удаления члена семьи:', err);
    }
  };

  // Выход приглашённого участника из семьи
  const handleLeaveFamily = async () => {
    if (!user || !userDoc?.familyHost?.uid) return;
    const hostUid = userDoc.familyHost.uid;
    try {
      await updateDoc(doc(db, 'users', hostUid), {
        linkedMemberIds: arrayRemove(user.uid),
        activeMemberIds: arrayRemove(user.uid),
        [`memberSyncPrefs.${user.uid}`]: deleteField()
      });
      await updateDoc(doc(db, 'users', user.uid), {
        familyHost: null,
        allowHostMenuSync: false,
        sharedWith: arrayRemove(hostUid)
      });
    } catch (err) {
      console.error('Ошибка выхода из семьи:', err);
    }
  };

  // Создание ссылки-приглашения
  const handleCreateInviteLink = async () => {
    if (!user) return '';
    const invRef = await addDoc(collection(db, 'invites'), {
      fromUid: user.uid,
      fromName: userDoc?.profile?.name || user.displayName || 'Пользователь',
      fromEmail: user.email || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    return `${baseUrl}?invite=${invRef.id}`;
  };

  return {
    userDoc,
    docLoading,
    incomingInvite,
    setIncomingInvite,
    inviteAllowMenuSync,
    setInviteAllowMenuSync,
    pendingRequests,
    linkedMembers,
    saveUserPatch,
    handleUpdateMemberSyncPref,
    handleRespondToInvite,
    handleRemoveLinkedMember,
    handleLeaveFamily,
    handleCreateInviteLink
  };
}
