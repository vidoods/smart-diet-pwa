import React, { useState } from 'react';
import {
  User,
  Users,
  UserPlus,
  Link2,
  Check,
  Trash2,
  ShieldCheck,
  ShieldOff,
  LogOut,
  Save,
  Copy,
  RefreshCw,
  DoorOpen
} from 'lucide-react';
import { EMPTY_PROFILE_FORM, calculateProfileMetrics } from '../utils/dietEngine';

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
  const [editProfile, setEditProfile] = useState(profile);
  const [savedNotice, setSavedNotice] = useState(false);

  // Состояние формы ручного добавления члена семьи
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState(EMPTY_PROFILE_FORM);
  const [manualError, setManualError] = useState('');

  // Состояние генерации ссылки-приглашения
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [creatingInvite, setCreatingInvite] = useState(false);

  const metrics = calculateProfileMetrics(editProfile);

  const handleProfileSave = (e) => {
    e.preventDefault();
    if (!editProfile.name?.trim() || !editProfile.age || !editProfile.height || !editProfile.weight) return;
    onSaveProfile({
      ...editProfile,
      name: editProfile.name.trim(),
      age: Number(editProfile.age),
      height: Number(editProfile.height),
      weight: Number(editProfile.weight)
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualForm.name.trim() || !manualForm.age || !manualForm.height || !manualForm.weight) {
      setManualError('Заполните имя, возраст, рост и вес члена семьи.');
      return;
    }
    onAddManualMember({
      id: `manual_${Date.now()}`,
      type: 'manual',
      profile: {
        ...manualForm,
        name: manualForm.name.trim(),
        age: Number(manualForm.age),
        height: Number(manualForm.height),
        weight: Number(manualForm.weight)
      }
    });
    setManualForm(EMPTY_PROFILE_FORM);
    setManualError('');
    setShowManualForm(false);
  };

  const handleGenerateInvite = async () => {
    setCreatingInvite(true);
    try {
      const link = await onCreateInviteLink();
      setInviteUrl(link);
    } finally {
      setCreatingInvite(false);
    }
  };

  const handleCopyInvite = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      <form onSubmit={handleProfileSave} className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" /> Мои параметры
          </h3>
          {metrics && (
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">
              Норма: {metrics.targetKcal} ккал • ИМТ {metrics.bmi}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] text-slate-500 block mb-1">Имя</label>
            <input
              type="text"
              value={editProfile.name}
              onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-500 block mb-1">Пол</label>
            <select
              value={editProfile.gender}
              onChange={(e) => setEditProfile({ ...editProfile, gender: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium"
            >
              <option value="male">Мужчина</option>
              <option value="female">Женщина</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[11px] text-slate-500 block mb-1">Возраст</label>
            <input
              type="number"
              value={editProfile.age}
              onChange={(e) => setEditProfile({ ...editProfile, age: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-500 block mb-1">Рост (см)</label>
            <input
              type="number"
              value={editProfile.height}
              onChange={(e) => setEditProfile({ ...editProfile, height: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-500 block mb-1">Вес (кг)</label>
            <input
              type="number"
              step="0.1"
              value={editProfile.weight}
              onChange={(e) => setEditProfile({ ...editProfile, weight: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] text-slate-500 block mb-1">Активность</label>
            <select
              value={editProfile.activity}
              onChange={(e) => setEditProfile({ ...editProfile, activity: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
            >
              <option value="sedentary">Минимальная (сидячий)</option>
              <option value="light">Слабая (пешие прогулки)</option>
              <option value="moderate">Умеренная (тренировки 3р/нед)</option>
              <option value="high">Высокая (спорт / физ. труд)</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] text-slate-500 block mb-1">Цель</label>
            <select
              value={editProfile.goal}
              onChange={(e) => setEditProfile({ ...editProfile, goal: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
            >
              <option value="loss">Снижение веса</option>
              <option value="maintain">Поддержание веса</option>
              <option value="gain">Набор массы</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition"
        >
          <Save className="w-4 h-4 text-emerald-400" />
          {savedNotice ? 'Параметры обновлены!' : 'Сохранить изменения'}
        </button>
      </form>

      {/* 5. Блок «Семья и совместные покупки» */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" /> Семья (для списка покупок)
          </h3>
        </div>

        {/* Кнопки добавления: вручную или по приглашению */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setShowManualForm(!showManualForm)}
            className="py-2.5 px-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-200 transition"
          >
            <UserPlus className="w-4 h-4" /> Добавить вручную
          </button>
          <button
            type="button"
            onClick={handleGenerateInvite}
            disabled={creatingInvite}
            className="py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition"
          >
            <Link2 className="w-4 h-4 text-emerald-600" /> Пригласить по ссылке
          </button>
        </div>

        {/* Сгенерированная ссылка-приглашение */}
        {inviteUrl && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
            <p className="text-[11px] text-slate-600">
              Отправьте эту ссылку члену семьи. После входа подтянутся его параметры для расчёта порций и покупок:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="flex-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-600"
              />
              <button
                type="button"
                onClick={handleCopyInvite}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shrink-0"
              >
                <Copy className="w-3.5 h-3.5" /> {copied ? 'Скопировано' : 'Копия'}
              </button>
            </div>
          </div>
        )}

        {/* Форма ручного добавления члена семьи */}
        {showManualForm && (
          <form onSubmit={handleManualSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
            <div className="text-xs font-bold text-slate-800">Новый профиль (без регистрации)</div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Имя члена семьи"
                value={manualForm.name}
                onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
              />
              <select
                value={manualForm.gender}
                onChange={(e) => setManualForm({ ...manualForm, gender: e.target.value })}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
              >
                <option value="female">Женщина</option>
                <option value="male">Мужчина</option>
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                placeholder="Возраст"
                value={manualForm.age}
                onChange={(e) => setManualForm({ ...manualForm, age: e.target.value })}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs"
              />
              <input
                type="number"
                placeholder="Рост (см)"
                value={manualForm.height}
                onChange={(e) => setManualForm({ ...manualForm, height: e.target.value })}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Вес (кг)"
                value={manualForm.weight}
                onChange={(e) => setManualForm({ ...manualForm, weight: e.target.value })}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={manualForm.activity}
                onChange={(e) => setManualForm({ ...manualForm, activity: e.target.value })}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs"
              >
                <option value="sedentary">Сидячий образ</option>
                <option value="light">Пешие прогулки</option>
                <option value="moderate">Тренировки 3р/нед</option>
                <option value="high">Высокая активность</option>
              </select>
              <select
                value={manualForm.goal}
                onChange={(e) => setManualForm({ ...manualForm, goal: e.target.value })}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs"
              >
                <option value="loss">Снижение веса</option>
                <option value="maintain">Поддержание веса</option>
                <option value="gain">Набор массы</option>
              </select>
            </div>
            {manualError && <p className="text-[11px] text-rose-600">{manualError}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                Сохранить в семью
              </button>
              <button
                type="button"
                onClick={() => setShowManualForm(false)}
                className="px-3 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Отмена
              </button>
            </div>
          </form>
        )}

        {/* Список добавленных членов семьи */}
        <div className="space-y-3">
          {manualMembers.length === 0 && linkedMembers.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-2">
              Пока никто не добавлен. Вы можете добавить близких вручную или пригласить по ссылке.
            </p>
          ) : (
            <>
              {manualMembers.map((m) => {
                const mm = calculateProfileMetrics(m.profile);
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between bg-slate-50 border border-slate-200/70 rounded-2xl px-3.5 py-2.5"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {m.profile.name}{' '}
                        <span className="text-[10px] font-normal text-slate-500">(ручной профиль)</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {m.profile.weight} кг • {m.profile.height} см • Норма {mm?.targetKcal} ккал
                      </div>
                    </div>
                    <button
                      onClick={() => onRemoveManualMember(m.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}

              {linkedMembers.map((m) => {
                const mm = calculateProfileMetrics(m.profile);
                return (
                  <div
                    key={m.id}
                    className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-emerald-950">
                          {m.profile.name}{' '}
                          <span className="text-[10px] font-semibold text-emerald-700">(подключён)</span>
                        </div>
                        <div className="text-[11px] text-emerald-800/80">
                          {m.profile.weight} кг • {m.profile.height} см • Норма {mm?.targetKcal} ккал
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Удалить ${m.profile.name} из семьи?`)) {
                            onRemoveLinkedMember(m.id);
                          }
                        }}
                        title="Удалить члена семьи"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-xl transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Удалить
                      </button>
                    </div>

                    {/* Переключатель 1: подтягивать ли индивидуальный выбор блюд этого участника */}
                    <label className="flex items-center justify-between bg-white/90 rounded-xl px-3 py-2 border border-emerald-200/60 cursor-pointer">
                      <span className="text-[11px] text-slate-700 font-medium pr-2">
                        Подтягивать выбор блюд от <b>{m.profile.name}</b> в моё меню и покупки (если отличается)
                      </span>
                      <input
                        type="checkbox"
                        checked={Boolean(m.useMemberMeals)}
                        onChange={(e) => onUpdateMemberSyncPref(m.id, 'useMemberMeals', e.target.checked)}
                        className="w-4 h-4 rounded accent-emerald-600 shrink-0"
                      />
                    </label>

                    {/* Переключатель 2: транслировать ли ваше меню в профиль этого участника */}
                    <label className="flex items-center justify-between bg-white/90 rounded-xl px-3 py-2 border border-emerald-200/60 cursor-pointer">
                      <div className="pr-2">
                        <div className="text-[11px] text-slate-700 font-medium flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 text-emerald-600" /> Синхронизировать моё меню в профиль <b>{m.profile.name}</b>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {m.allowHostMenuSync
                            ? 'Участник разрешил синхронизацию меню'
                            : 'Ожидает разрешения синхронизации в профиле участника'}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(m.pushMyMenu)}
                        onChange={(e) => onUpdateMemberSyncPref(m.id, 'pushMyMenu', e.target.checked)}
                        className="w-4 h-4 rounded accent-emerald-600 shrink-0"
                      />
                    </label>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}