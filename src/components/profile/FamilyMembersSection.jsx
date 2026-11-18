import React, { useState } from 'react';
import { UserPlus, Link2, Copy, Trash2, RefreshCw } from 'lucide-react';
import { calculateProfileMetrics } from '../../utils/dietEngine';
import ManualMemberForm from './ManualMemberForm';

export default function FamilyMembersSection({
  manualMembers,
  onAddManualMember,
  onRemoveManualMember,
  linkedMembers,
  onUpdateMemberSyncPref,
  onRemoveLinkedMember,
  onCreateInviteLink
}) {
  const [showManualForm, setShowManualForm] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [creatingInvite, setCreatingInvite] = useState(false);

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
    <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-emerald-600" /> Семья (для списка покупок)
        </h3>
      </div>

      {/* Кнопки добавления: вручную или по ссылке */}
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

      {/* Сгенерированная ссылка */}
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

      {/* Форма ручного добавления */}
      {showManualForm && (
        <ManualMemberForm
          onAddMember={(newMember) => {
            onAddManualMember(newMember);
            setShowManualForm(false);
          }}
          onCancel={() => setShowManualForm(false)}
        />
      )}

      {/* Список членов семьи */}
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

                  {/* Подтягивать ли индивидуальный выбор блюд */}
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

                  {/* Транслировать ли меню в профиль этого участника */}
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
  );
}
