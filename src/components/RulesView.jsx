import React, { useState } from 'react';
import {
  BookOpen,
  Scale,
  TrendingDown,
  TrendingUp,
  HeartPulse,
  Clock,
  Droplets,
  Flame,
  Ban,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ShieldAlert
} from 'lucide-react';

const GOALS_CARDS = [
  {
    id: 'loss',
    title: 'Снижение веса',
    badge: 'Комфортный дефицит',
    icon: TrendingDown,
    color: 'emerald',
    text: 'Плавное уменьшение жировой прослойки за счёт сбалансированного дефицита калорий, контроля инсулиновых пиков и регулярного дробного питания без чувства голода и потери мышечной массы.'
  },
  {
    id: 'maintain',
    title: 'Поддержание формы и здоровья',
    badge: 'Стабильный баланс',
    icon: HeartPulse,
    color: 'sky',
    text: 'Ровный уровень энергии в течение дня, нормализация пищеварения, стабильное самочувствие и закрепление достигнутого веса без откатов.'
  },
  {
    id: 'gain',
    title: 'Набор качественной массы',
    badge: 'Профицит + белок',
    icon: TrendingUp,
    color: 'amber',
    text: 'Увеличение объёма порций за счёт сложных углеводов, полноценного белка и полезных жиров для роста мышц без накопления лишнего жира.'
  }
];

const CORE_PRINCIPLES = [
  {
    num: 1,
    title: 'Режим приёмов пищи по биологическим часам',
    icon: Clock,
    summary: '4–5 приёмов пищи без пропусков стабилизируют уровень энергии и защищают от вечернего переедания.',
    points: [
      'Завтрак: 06:00 – 09:00 (не позднее чем через 2 часа после пробуждения — пропускать нельзя)[cite: 10, 23].',
      'Второй завтрак: 09:00 – 11:00 (фрукты, ягоды, кисломолочные продукты или орехи)[cite: 10, 15, 17].',
      'Обед: 12:00 – 14:00 (основной приём сложных углеводов, белка и овощей)[cite: 10, 23].',
      'Полдник (при необходимости): 15:00 – 17:00[cite: 10, 23].',
      'Ужин: 17:00 – 20:00 (строго за 3–4 часа до сна — лёгкий белок с овощами)[cite: 10, 23].'
    ]
  },
  {
    num: 2,
    title: 'Водный баланс и напитки',
    icon: Droplets,
    summary: 'Чистая вода поддерживает обмен веществ и предотвращает ложное чувство голода.',
    points: [
      'Суточная норма: 1,5 – 2 литра чистой негазированной воды комнатной температуры (из расчёта 30 мл на 1 кг идеальной массы тела), пить небольшими порциями по 200–300 мл[cite: 9, 23].',
      'В холодное время года в норму жидкости можно включать травяные чаи (мята, ромашка, мелисса, имбирь, но не липа и шиповник)[cite: 23].',
      'Чёрный и зелёный чай, кофе, супы и другие напитки в суточную норму воды не входят[cite: 9, 23].',
      'Заварной чай и натуральный кофе разрешены без сахара (не более 2 чашек в день; растворимый кофе исключается)[cite: 10]. Каждую чашку чая или кофе желательно компенсировать 2 чашками чистой воды[cite: 23].'
    ]
  },
  {
    num: 3,
    title: 'Правильные жиры и способ приготовления',
    icon: Flame,
    summary: 'Качественные жиры необходимы для усвоения жирорастворимых витаминов и длительного чувства сытости.',
    points: [
      'Ежедневно в рационе: 1 ч. л. сливочного масла и 1–2 ст. л. нерафинированного растительного масла в салаты[cite: 9].',
      'Для жарки и тушения используйте топлёное масло (масло гхи) вместо растительного[cite: 9].',
      'Предпочтительные способы готовки: на пару, тушение, запекание, варка или гриль[cite: 12].',
      'При варке мясных супов первый бульон после 15–20 минут кипения обязательно сливайте[cite: 12].'
    ]
  },
  {
    num: 4,
    title: 'Выбор базовых продуктов: белок, крупы и молочное',
    icon: CheckCircle2,
    summary: 'Сбалансированный состав нутриентов обеспечивает организм аминокислотами, клетчаткой и Омега-3.',
    points: [
      'Мясо и птица: любые нежирные сорта (индейка, курица, говядина, телятина, кролик) с удалением кожи и видимого жира[cite: 12]. Свинина исключается[cite: 12, 23].',
      'Рыба и морепродукты: любые сорта, особенно ценна жирная морская рыба (лосось, скумбрия, форель) как источник Омега-3[cite: 12].',
      'Крупы: только цельнозерновые (гречка, овсяная крупа долгой варки — не хлопья, неочищенный рис, булгур, ячневая, чечевица)[cite: 13]. Замачивание перед варкой сокращает время готовки и сохраняет витамины[cite: 13].',
      'Молочные продукты средней жирности: творог до 9%, сметана до 20%, кефир до 2,5%, ряженка до 4%, натуральный йогурт без добавок до 4,5%, любой сыр[cite: 12]. Обезжиренные продукты 0% не используются[cite: 12].'
    ]
  },
  {
    num: 5,
    title: 'Контроль порций, соли и активности',
    icon: Scale,
    summary: 'Точный вес готового блюда гарантирует попадание в вашу персональную норму КБЖУ.',
    points: [
      'Все граммовки в конструкторе меню указаны для ГОТОВОГО блюда[cite: 13]. Можно съесть чуть меньше, но не превышать указанный вес[cite: 13].',
      'Соль: до 5 г в сутки (неполная чайная ложка), острые специи — умеренно, чтобы не раздражать пищеварительный тракт и не возбуждать аппетит[cite: 13, 23].',
      'После приёма пищи не принимайте горизонтальное положение минимум 30 минут[cite: 14, 23], а в течение дня поддерживайте умеренную физическую активность[cite: 23].',
      'Раз в неделю полезно проводить разгрузочный день (особенно после праздничных застолий или перееданий) для мягкой разгрузки пищеварения[cite: 23].'
    ]
  }
];

const EXCLUDED_ITEMS = [
  'Сахар, фруктоза и любые сахарозаменители[cite: 11]',
  'Колбасы, сосиски, ветчина, бекон и магазинные мясные полуфабрикаты[cite: 11]',
  'Солёная и копчёная рыба, селёдка, сушёные кальмары[cite: 11, 23]',
  'Майонез и магазинные соусы с сахаром и трансжирами[cite: 11]',
  'Сладкие газированные напитки, пакетированные соки, квас, пиво (включая безалкогольное)[cite: 11, 23]',
  'Чипсы, солёные сухарики, жареные семечки и фастфуд[cite: 11]',
  'Свинина и жирные сорта мяса[cite: 12, 23]'
];

const LIMITED_ITEMS = [
  'Сладкие фрукты с высоким гликемическим индексом: банан, виноград, манго, арбуз, дыня (употребляются только в первой половине дня)[cite: 11, 23]',
  'Картофель и макароны из твёрдых сортов пшеницы (строго в рамках порции на обед)[cite: 11, 13, 23]',
  'Орехи (миндаль, грецкий, фундук) и сухофрукты[cite: 11]',
  'Цельнозерновой хлеб и мёд (в строго заданном весе)[cite: 11]'
];

export default function RulesView() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="space-y-4 pb-24">
      {/* 1. Вводная карточка: зачем нужна эта система питания */}
      <div className="bg-linear-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-5 shadow-xl border border-slate-800 space-y-3">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-400/25 px-3 py-1 rounded-xl">
          <BookOpen className="w-3.5 h-3.5" /> Методика сбалансированного рациона
        </div>
        <h2 className="text-xl font-extrabold tracking-tight leading-snug">
          Как работает система питания и зачем она нужна
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Это практичный конструктор рациона, который автоматически рассчитывает вашу индивидуальную норму калорий, белков, жиров и углеводов под ваш рост, вес, возраст и уровень активности. Никаких голодовок и подсчёта каждой крошки вручную — вы просто выбираете любимые блюда из списка, а приложение само подстраивает вес порций под вашу цель.
        </p>
      </div>

      {/* 2. Три цели: похудение, здоровье, набор массы */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 px-1">
          Как рацион помогает под вашу цель
        </h3>
        {GOALS_CARDS.map((goal) => {
          const Icon = goal.icon;
          const badgeColors = {
            emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            sky: 'bg-sky-50 text-sky-700 border-sky-200',
            amber: 'bg-amber-50 text-amber-700 border-amber-200'
          };
          const iconColors = {
            emerald: 'bg-emerald-100 text-emerald-700',
            sky: 'bg-sky-100 text-sky-700',
            amber: 'bg-amber-100 text-amber-700'
          };

          return (
            <div
              key={goal.id}
              className="tap-spring bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${iconColors[goal.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{goal.title}</div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border ${badgeColors[goal.color]}`}>
                  {goal.badge}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{goal.text}</p>
            </div>
          );
        })}
      </div>

      {/* 3. 5 главных принципов питания (аккордеон) */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 px-1">
          5 ключевых принципов
        </h3>
        {CORE_PRINCIPLES.map((item, idx) => {
          const Icon = item.icon;
          const isOpen = openIndex === idx;
          return (
            <div
              key={item.num}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden transition-shadow duration-200 hover:shadow-md"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                className="tap-spring w-full p-4 flex items-start justify-between gap-3 text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-2xl bg-emerald-50 text-emerald-700 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200/70">
                    {item.num}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <span>{item.title}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-snug">{item.summary}</p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 shrink-0 mt-1 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 text-emerald-600' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="animate-accordion px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/60 space-y-2">
                  {item.points.map((pt, pIdx) => (
                    <div key={pIdx} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                      <Icon className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-1" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. Что исключаем полностью */}
      <div className="bg-rose-50/70 border border-rose-200/80 rounded-3xl p-4 space-y-2.5">
        <div className="flex items-center gap-2 font-bold text-rose-950 text-sm">
          <Ban className="w-4 h-4 text-rose-600" /> Что полностью исключается из рациона[cite: 11]
        </div>
        <p className="text-[11px] text-rose-800/80">
          Эти продукты задерживают жидкость, провоцируют скачки сахара в крови и тормозят снижение веса:
        </p>
        <ul className="space-y-1.5">
          {EXCLUDED_ITEMS.map((ex, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-rose-950">
              <span className="text-rose-500 font-bold">•</span>
              <span>{ex}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 5. Что употребляем умеренно */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-4 space-y-2.5">
        <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
          <ShieldAlert className="w-4 h-4 text-amber-600" /> Продукты с контролем порций[cite: 11]
        </div>
        <ul className="space-y-1.5">
          {LIMITED_ITEMS.map((lim, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-amber-950">
              <span className="text-amber-600 font-bold">•</span>
              <span>{lim}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 6. Закрепление результата (стабилизация) */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
          <Sparkles className="w-4 h-4 text-emerald-600" /> Как удержать вес после похудения
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Когда вы достигнете желаемого веса, переключите цель в разделе <b>«Профиль»</b> на <b>«Поддержание веса»</b>. Программа плавно пересчитает размер порций под поддерживающую калорийность, сохранив привычный режим и любимые блюда без эффекта возврата килограммов. Раз в 1–2 недели на этапе стабилизации допустим 1 свободный приём пищи (Cheat meal)[cite: 23].
        </p>
      </div>
    </div>
  );
}