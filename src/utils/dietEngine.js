// Константа-маркер для проверки, заполнен ли профиль у пользователя
export function isProfileComplete(profile) {
  if (!profile) return false;
  return Boolean(
    profile.name?.trim() &&
    (profile.gender === 'male' || profile.gender === 'female') &&
    Number(profile.age) > 0 &&
    Number(profile.height) > 0 &&
    Number(profile.weight) > 0 &&
    profile.activity &&
    profile.goal
  );
}

// Шаблон пустой формы для первичного заполнения новым пользователем
export const EMPTY_PROFILE_FORM = {
  name: '',
  gender: 'male',
  age: '',
  height: '',
  weight: '',
  activity: 'light',
  goal: 'loss'
};

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725
};

const GOAL_FACTORS = {
  loss: 0.6065,
  maintain: 0.85,
  gain: 1.0
};

export function calculateProfileMetrics(profile) {
  if (!isProfileComplete(profile)) {
    return null;
  }

  const gender = profile.gender;
  const age = Number(profile.age);
  const height = Number(profile.height);
  const weight = Number(profile.weight);
  const activity = profile.activity;
  const goal = profile.goal;

  const bmi = Number((weight / Math.pow(height / 100, 2)).toFixed(1));
  const bmr = Math.round(10 * weight + 6.25 * height - 5 * age + (gender === 'male' ? 5 : -161));
  const tdee = Math.round(bmr * (ACTIVITY_MULTIPLIERS[activity] || 1.375));

  // Клинический предохранитель: не ниже 1400 ккал для мужчин и 1200 ккал для женщин
  const minKcal = gender === 'male' ? 1400 : 1200;
  const targetKcal = Math.round(Math.max(minKcal, tdee * (GOAL_FACTORS[goal] || 0.6065)));

  // Эталонная база рецептов в Google Таблице рассчитана на 1450 ккал (K = 1.00)
  const scale = targetKcal / 1450;

  return { bmi, bmr, tdee, targetKcal, scale };
}

// Динамически пересчитывает граммовки внутри текста блюда с округлением до 5 г/мл
export function scaleTextWeights(text, scale) {
  if (!text || !scale) return text || '';
  return text.replace(/(\d+)\s*(г|гр|мл)\b/gi, (_, num, unit) => {
    const raw = Number(num) * scale;
    const rounded = Math.max(5, Math.round(raw / 5) * 5);
    return `${rounded} ${unit}`;
  });
}

export function scaleMacros(item, scale) {
  if (!item || !scale) return { kcal: 0, protein: 0, fat: 0, carbs: 0 };
  return {
    kcal: Math.round((item.kcal || 0) * scale),
    protein: Math.round((item.protein || 0) * scale),
    fat: Math.round((item.fat || 0) * scale),
    carbs: Math.round((item.carbs || 0) * scale)
  };
}

// Сборка и умное округление общего списка покупок (на 1 человека или всю семью)
export function buildGroceryList(allIngredients, participants, days = 3) {
  const map = new Map();

  participants.forEach((person) => {
    const metrics = calculateProfileMetrics(person.profile);
    if (!metrics) return;

    const { scale } = metrics;
    const selectedMeals = [
      { type: 'Завтрак', num: person.selected?.breakfast },
      { type: 'Второй завтрак', num: person.selected?.secondBreakfast },
      { type: 'Обед', num: person.selected?.lunch },
      { type: 'Ужин', num: person.selected?.dinner }
    ].filter((m) => m.num);

    selectedMeals.forEach(({ type, num }) => {
      const matched = allIngredients.filter(
        (ing) => ing.mealType === type && Number(ing.mealNumber) === Number(num)
      );
      matched.forEach((ing) => {
        const key = `${ing.product}__${ing.unit}`;
        const existing = map.get(key) || {
          key,
          product: ing.product,
          unit: ing.unit,
          category: ing.category || 'Прочее',
          rawTotal: 0
        };
        existing.rawTotal += ing.amount * scale * days;
        map.set(key, existing);
      });
    });
  });

  return Array.from(map.values())
    .map((item) => {
      const isPiece = item.unit.toLowerCase().includes('шт');
      const finalAmount = isPiece
        ? Math.max(1, Math.round(item.rawTotal))
        : Math.max(5, Math.round(item.rawTotal / 5) * 5);
      return { ...item, amount: finalAmount };
    })
    .sort((a, b) => a.category.localeCompare(b.category, 'ru'));
}