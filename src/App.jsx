import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
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
  arrayRemove
} from 'firebase/firestore';
import { Utensils, ShoppingBag, Users, WifiOff, LogIn, Sparkles, CheckCircle2 } from 'lucide-react';
import { auth, googleProvider, db, APPS_SCRIPT_URL } from './firebase';
import { isProfileComplete } from './utils/dietEngine';
import OnboardingView from './components/OnboardingView';
import MenuView from './components/MenuView';
import GroceryView from './components/GroceryView';
import ProfileFamilyView from './components/ProfileFamilyView';

const MENU_CACHE_KEY = 'smart_diet_menu_cache_v1';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userDoc, setUserDoc] = useState(null);
  const [docLoading, setDocLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'grocery' | 'profile'
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  // Справочник блюд и ингредиентов из Google Таблицы (с офлайн-кэшем в localStorage)
  const [menuData, setMenuData] = useState(() => {
    try {
      const cached = localStorage.getItem(MENU_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  // Семейные приглашения и данные подключенных близких
  const [incomingInvite, setIncomingInvite] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [linkedMembers, setLinkedMembers] = useState([]);

  // Отслеживание состояния сети
  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Загрузка и кэширование меню из Google Apps Script
  const syncMenuFromSheet = useCallback(async () => {
    if (!navigator.onLine) return;
    setIsSyncing(true);
    try {
      const res = await fetch(APPS_SCRIPT_URL);
      const data = await res.json();
      if (data?.menu) {
        setMenuData(data);
        localStorage.setItem(MENU_CACHE_KEY, JSON.stringify(data));
      }
    } catch (err) {
      console.error('Ошибка синхронизации меню:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    syncMenuFromSheet();
  }, [syncMenuFromSheet]);

  // Авторизация Firebase
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser) {
        setUserDoc(null);
        setDocLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // Подписка на личный документ пользователя в Firestore (работает и в офлайн-режиме!)
  useEffect(() => {
    if (!user) return;
    setDocLoading(true);
    const userRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          setUserDoc(snap.data());
        } else {
          setUserDoc({
            profile: null,
            selected: { breakfast: 1, secondBreakfast: 1, lunch: 1, dinner: 1 },
            days: 3,
            checkedItems: {},
            manualMembers: [],
            linkedMemberIds: [],
            activeMemberIds: [],
            sharedWith: []
          });
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

  // Проверка параметра ?invite=... в URL при переходе по ссылке-приглашению
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
          }
        }
      } catch (err) {
        console.error('Ошибка проверки приглашения:', err);
      }
    };
    loadInvite();
  }, [user]);

  // Подписка на входящие запросы доступа, адресованные текущему пользователю
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

  // Подписка на профили подключенных членов семьи (для совместного списка покупок)
  useEffect(() => {
    const ids = userDoc?.linkedMemberIds || [];
    if (!user || ids.length === 0) {
      setLinkedMembers([]);
      return;
    }
    const unsubs = ids.map((memberUid) =>
      onSnapshot(
        doc(db, 'users', memberUid),
        (snap) => {
          if (snap.exists() && isProfileComplete(snap.data().profile)) {
            setLinkedMembers((prev) => {
              const filtered = prev.filter((item) => item.id !== memberUid);
              return [
                ...filtered,
                {
                  id: memberUid,
                  type: 'linked',
                  profile: snap.data().profile,
                  selected: snap.data().selected || {}
                }
              ];
            });
          }
        },
        () => {
          // Если член семьи отозвал разрешение на чтение — убираем из списка
          setLinkedMembers((prev) => prev.filter((item) => item.id !== memberUid));
        }
      )
    );
    return () => unsubs.forEach((u) => u());
  }, [user, userDoc?.linkedMemberIds]);

  const saveUserPatch = async (patch) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const nextData = { ...(userDoc || {}), ...patch };
    setUserDoc(nextData);
    await setDoc(userRef, nextData, { merge: true });
  };

  // Принятие или отклонение приглашения (по ссылке ?invite= или из списка запросов)
  const handleRespondToInvite = async (inviteObj, approve) => {
    if (!user || !inviteObj) return;
    try {
      await updateDoc(doc(db, 'invites', inviteObj.id), {
        status: approve ? 'accepted' : 'declined',
        toUid: user.uid,
        toName: userDoc?.profile?.name || user.displayName || 'Член семьи'
      });

      if (approve) {
        // Разрешаем пригласившему читать наш профиль и меню
        await updateDoc(doc(db, 'users', user.uid), {
          sharedWith: arrayUnion(inviteObj.fromUid)
        });
        // Добавляем пригласившего в наш список подключенных, чтобы синхронизировать связь
        await updateDoc(doc(db, 'users', inviteObj.fromUid), {
          linkedMemberIds: arrayUnion(user.uid),
          activeMemberIds: arrayUnion(user.uid)
        });
      }
      setIncomingInvite(null);
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      console.error('Ошибка обработки приглашения:', err);
    }
  };

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

  // Экран загрузки
  if (authLoading || (user && docLoading)) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Загрузка данных...</p>
      </div>
    );
  }

  // Экран входа через Google
  if (!user) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-950 via-emerald-950 to-slate-900 text-white px-6 flex items-center justify-center">
        <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-7 text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto text-emerald-300">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight">Smart Diet Calculator</h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Персональный расчет порций, КБЖУ и умный семейный список покупок с работой без интернета.
            </p>
          </div>
          <button
            onClick={() => signInWithPopup(auth, googleProvider)}
            className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl transition active:scale-[0.99]"
          >
            <LogIn className="w-5 h-5 text-emerald-600" /> Войти через Google
          </button>
        </div>
      </div>
    );
  }

  // Первичный запрос антропометрических параметров у нового пользователя
  if (!isProfileComplete(userDoc?.profile)) {
    return (
      <OnboardingView
        userEmail={user.email}
        onSave={(newProfile) => saveUserPatch({ profile: newProfile })}
      />
    );
  }

  const allFamilyMembers = [...(userDoc.manualMembers || []), ...linkedMembers];

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900">
      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* Индикатор офлайн-режима */}
        {isOffline && (
          <div className="mb-3 bg-slate-800 text-amber-300 text-xs font-semibold px-3.5 py-2 rounded-2xl flex items-center justify-center gap-2">
            <WifiOff className="w-4 h-4" /> Офлайн-режим: изменения сохранятся и синхронизируются при появлении сети
          </div>
        )}

        {/* Баннер подтверждения приглашения по ссылке */}
        {incomingInvite && (
          <div className="mb-4 bg-emerald-900 text-white rounded-3xl p-4 shadow-lg space-y-3">
            <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              Семейное приглашение
            </div>
            <p className="text-sm leading-snug">
              <b>{incomingInvite.fromName}</b> ({incomingInvite.fromEmail}) приглашает вас в общий список покупок. Разрешить чтение вашего выбранного меню и нормы калорий?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleRespondToInvite(incomingInvite, true)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" /> Разрешить доступ
              </button>
              <button
                onClick={() => handleRespondToInvite(incomingInvite, false)}
                className="px-4 py-2.5 rounded-xl bg-white/15 text-white text-xs font-semibold"
              >
                Отклонить
              </button>
            </div>
          </div>
        )}

        {/* Основной контент вкладок */}
        {activeTab === 'menu' && (
          <MenuView
            profile={userDoc.profile}
            menuData={menuData}
            selected={userDoc.selected}
            onSelectMeal={(mealKey, dishNumber) =>
              saveUserPatch({
                selected: { ...(userDoc.selected || {}), [mealKey]: dishNumber }
              })
            }
            onSyncMenu={syncMenuFromSheet}
            isSyncing={isSyncing}
            isOffline={isOffline}
          />
        )}

        {activeTab === 'grocery' && (
          <GroceryView
            allIngredients={menuData?.ingredients || []}
            myParticipant={{
              id: user.uid,
              profile: userDoc.profile,
              selected: userDoc.selected
            }}
            familyMembers={allFamilyMembers.map((m) =>
              m.type === 'manual' ? { ...m, selected: userDoc.selected } : m
            )}
            activeMemberIds={userDoc.activeMemberIds || []}
            onToggleMember={(memberId) => {
              const current = userDoc.activeMemberIds || [];
              const next = current.includes(memberId)
                ? current.filter((id) => id !== memberId)
                : [...current, memberId];
              saveUserPatch({ activeMemberIds: next });
            }}
            days={userDoc.days || 3}
            onChangeDays={(d) => saveUserPatch({ days: d })}
            checkedItems={userDoc.checkedItems || {}}
            onToggleItem={(key) => {
              const current = userDoc.checkedItems || {};
              saveUserPatch({
                checkedItems: { ...current, [key]: !current[key] }
              });
            }}
            onClearChecked={() => saveUserPatch({ checkedItems: {} })}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileFamilyView
            user={user}
            profile={userDoc.profile}
            onSaveProfile={(updatedProfile) => saveUserPatch({ profile: updatedProfile })}
            manualMembers={userDoc.manualMembers || []}
            onAddManualMember={(newMember) =>
              saveUserPatch({
                manualMembers: [...(userDoc.manualMembers || []), newMember],
                activeMemberIds: [...(userDoc.activeMemberIds || []), newMember.id]
              })
            }
            onRemoveManualMember={(id) =>
              saveUserPatch({
                manualMembers: (userDoc.manualMembers || []).filter((m) => m.id !== id),
                activeMemberIds: (userDoc.activeMemberIds || []).filter((mid) => mid !== id)
              })
            }
            linkedMembers={linkedMembers}
            onRemoveLinkedMember={async (memberUid) => {
              await updateDoc(doc(db, 'users', user.uid), {
                linkedMemberIds: arrayRemove(memberUid),
                activeMemberIds: arrayRemove(memberUid)
              });
            }}
            pendingRequests={pendingRequests}
            onRespondToRequest={handleRespondToInvite}
            onCreateInviteLink={handleCreateInviteLink}
            onLogout={() => signOut(auth)}
          />
        )}
      </div>

      {/* Нижняя стеклянная панель навигации (iOS Tab Bar) */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/85 backdrop-blur-xl border-t border-slate-200/80 z-40">
        <div className="max-w-lg mx-auto grid grid-cols-3 py-2 px-4">
          {[
            { id: 'menu', label: 'Меню', icon: Utensils },
            { id: 'grocery', label: 'Покупки', icon: ShoppingBag },
            { id: 'profile', label: 'Профиль', icon: Users }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1 rounded-2xl transition ${
                  active ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${active ? 'stroke-[2.5]' : ''}`} />
                <span className="text-[11px] font-bold">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}