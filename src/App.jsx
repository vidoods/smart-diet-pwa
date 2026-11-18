import React, { useState, useEffect } from 'react';
import {
  Utensils,
  ShoppingBag,
  Users,
  BookOpen,
  WifiOff,
  LogIn,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { isProfileComplete } from './utils/dietEngine';
import { useAuth } from './hooks/useAuth';
import { useMenuData } from './hooks/useMenuData';
import { useFamilySync } from './hooks/useFamilySync';

import OnboardingView from './components/OnboardingView';
import MenuView from './components/MenuView';
import GroceryView from './components/GroceryView';
import ProfileFamilyView from './components/ProfileFamilyView';
import RulesView from './components/RulesView';

export default function App() {
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'grocery' | 'rules' | 'profile'
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // 1. Авторизация
  const { user, authLoading, loginWithGoogle, logout } = useAuth();

  // 2. Справочник меню из Google Sheets + офлайн-кэш
  const { menuData, isSyncing, syncMenuFromSheet } = useMenuData();

  // 3. Семейная синхронизация и данные пользователя в Firestore
  const {
    userDoc,
    docLoading,
    incomingInvite,
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
  } = useFamilySync(user);

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
        <div className="animate-tab-enter w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-7 text-center shadow-2xl space-y-6">
          <div className="animate-glow w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto text-emerald-300">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight">Smart Diet Calculator</h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Персональный расчет порций, КБЖУ и умный семейный список покупок с работой без интернета.
            </p>
          </div>
          <button
            onClick={loginWithGoogle}
            className="tap-spring w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl"
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
    <div className="min-h-screen bg-slate-100/80 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* Индикатор офлайн-режима */}
        {isOffline && (
          <div className="animate-accordion mb-3 bg-slate-800 dark:bg-slate-900 border border-transparent dark:border-slate-800 text-amber-300 text-xs font-semibold px-3.5 py-2 rounded-2xl flex items-center justify-center gap-2">
            <WifiOff className="w-4 h-4" /> Офлайн-режим: изменения сохранятся и синхронизируются при появлении сети
          </div>
        )}

        {/* Баннер подтверждения приглашения по ссылке */}
        {incomingInvite && (
          <div className="animate-accordion mb-4 bg-emerald-900 text-white rounded-3xl p-4 shadow-lg space-y-3">
            <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              Семейное приглашение
            </div>
            <p className="text-sm leading-snug">
              <b>{incomingInvite.fromName}</b> ({incomingInvite.fromEmail}) приглашает вас в общий список покупок. Ваши порции всегда рассчитываются по вашим индивидуальным параметрам.
            </p>
            <label className="flex items-start gap-2.5 bg-white/10 rounded-2xl p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={inviteAllowMenuSync}
                onChange={(e) => setInviteAllowMenuSync(e.target.checked)}
                className="mt-0.5 rounded accent-emerald-400 w-4 h-4"
              />
              <span className="text-xs text-emerald-100 leading-snug">
                Разрешить синхронизацию меню с <b>{incomingInvite.fromName}</b> (выбор блюд будет обновляться автоматически, а граммовки останутся вашими)
              </span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleRespondToInvite(incomingInvite, true, inviteAllowMenuSync)}
                className="tap-spring flex-1 py-2.5 rounded-xl bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" /> Вступить в семью
              </button>
              <button
                onClick={() => handleRespondToInvite(incomingInvite, false, false)}
                className="tap-spring px-4 py-2.5 rounded-xl bg-white/15 text-white text-xs font-semibold"
              >
                Отклонить
              </button>
            </div>
          </div>
        )}

        {/* Анимированный контейнер активной вкладки */}
        <div key={activeTab} className="animate-tab-enter">
          {activeTab === 'menu' && (
            <MenuView
              profile={userDoc.profile}
              menuData={menuData}
              selected={userDoc.selected}
              linkedMembers={linkedMembers}
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

          {activeTab === 'rules' && <RulesView />}

          {activeTab === 'profile' && (
            <ProfileFamilyView
              user={user}
              profile={userDoc.profile}
              onSaveProfile={(updatedProfile) => saveUserPatch({ profile: updatedProfile })}
              familyHost={userDoc.familyHost || null}
              allowHostMenuSync={Boolean(userDoc.allowHostMenuSync)}
              onToggleAllowHostMenuSync={(val) => saveUserPatch({ allowHostMenuSync: val })}
              onLeaveFamily={handleLeaveFamily}
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
              onUpdateMemberSyncPref={handleUpdateMemberSyncPref}
              onRemoveLinkedMember={handleRemoveLinkedMember}
              pendingRequests={pendingRequests}
              onRespondToRequest={handleRespondToInvite}
              onCreateInviteLink={handleCreateInviteLink}
              onLogout={logout}
            />
          )}
        </div>
      </div>

      {/* Нижняя стеклянная панель навигации (iOS Tab Bar) */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-850 dark:border-slate-800 z-40 transition-colors">
        <div className="max-w-lg mx-auto grid grid-cols-4 py-2 px-3 gap-1">
          {[
            { id: 'menu', label: 'Меню', icon: Utensils },
            { id: 'grocery', label: 'Покупки', icon: ShoppingBag },
            { id: 'rules', label: 'Правила', icon: BookOpen },
            { id: 'profile', label: 'Профиль', icon: Users }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tap-spring relative flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all duration-200 ${
                  active
                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/12 dark:bg-emerald-500/15 shadow-xs'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <Icon
                  className={`w-5 h-5 mb-0.5 transition-transform duration-200 ${
                    active ? 'stroke-[2.5] scale-110 text-emerald-600 dark:text-emerald-400' : 'scale-100'
                  }`}
                />
                <span className="text-[11px] font-bold tracking-tight">{tab.label}</span>
                {active && (
                  <span className="absolute -bottom-1 w-4 h-1 rounded-full bg-emerald-500 transition-all duration-300" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
