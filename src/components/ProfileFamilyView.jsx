import React from 'react';
import { User, LogOut, Users, DoorOpen, ShieldCheck, Check, ShieldOff } from 'lucide-react';
import UserProfileForm from './profile/UserProfileForm';
import FamilyMembersSection from './profile/FamilyMembersSection';

export default function ProfileFamilyView({
  user,
  profile,
  onSaveProfile,
  familyHost,
  allowHostMenuSync,
  onToggleAllowHostMenuSync,
  onLeaveFamily,
  manualMembers,
  onAddManualMember,
  onRemoveManualMember,
  linkedMembers,
  onUpdateMemberSyncPref,
  onRemoveLinkedMember,
  pendingRequests,
  onRespondToRequest,
  onCreateInviteLink,
  onLogout
}) {
  return (
    <div className="space-y-4 pb-24">
      {/* 1. Карточка аккаунта */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-11 h-11 rounded-2xl object-cover" />
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
          )}
          <div>
            <div className="font-bold text-slate-900 text-sm">{profile.name}</div>
            <div className="text-xs text-slate-500">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl transition"
        >
          <LogOut className="w-4 h-4" /> Выйти
        </button>
      </div>

      {/* 2. Блок участника семьи (если вас пригласил глава семьи) */}
      {familyHost?.uid && (
        <div className="bg-indigo-50/80 border border-indigo-200 rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" /> Вы в семье у {familyHost.name}
              </div>
              <div className="text-[11px] text-indigo-700 mt-0.5">{familyHost.email}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Выйти из семьи пользователя ${familyHost.name}?`)) {
                  onLeaveFamily();
                }
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl transition"
            >
              <DoorOpen className="w-3.5 h-3.5" /> Выйти из семьи
            </button>
          </div>

          <label className="flex items-center justify-between bg-white rounded-2xl p-3 border border-indigo-200/70 cursor-pointer">
            <div className="pr-3">
              <div className="text-xs font-bold text-slate-900">Синхронизировать моё меню с главой семьи</div>
              <div className="text-[11px] text-slate-500 leading-snug mt-0.5">
                Блюда будут обновляться от <b>{familyHost.name}</b>, а вес порций и КБЖУ останутся строго по вашим параметрам.
              </div>
            </div>
            <input
              type="checkbox"
              checked={allowHostMenuSync}
              onChange={(e) => onToggleAllowHostMenuSync(e.target.checked)}
              className="w-5 h-5 rounded accent-indigo-600 shrink-0"
            />
          </label>
        </div>
      )}

      {/* 3. Входящие запросы на доступ к вашему меню */}
      {pendingRequests?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-amber-600" /> Запросы на доступ к вашему меню
          </div>
          {pendingRequests.map((req) => (
            <div key={req.id} className="bg-white rounded-2xl p-3 border border-amber-200/70 space-y-2">
              <p className="text-xs text-slate-700">
                Пользователь <b>{req.fromName}</b> ({req.fromEmail}) приглашает вас в семью для общего списка покупок.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onRespondToRequest(req, true, true)}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" /> Вступить
                </button>
                <button
                  onClick={() => onRespondToRequest(req, false, false)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1"
                >
                  <ShieldOff className="w-4 h-4" /> Отклонить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Мои антропометрические параметры */}
      <UserProfileForm profile={profile} onSaveProfile={onSaveProfile} />

      {/* 5. Блок «Семья и совместные покупки» */}
      <FamilyMembersSection
        manualMembers={manualMembers}
        onAddManualMember={onAddManualMember}
        onRemoveManualMember={onRemoveManualMember}
        linkedMembers={linkedMembers}
        onUpdateMemberSyncPref={onUpdateMemberSyncPref}
        onRemoveLinkedMember={onRemoveLinkedMember}
        onCreateInviteLink={onCreateInviteLink}
      />
    </div>
  );
}
