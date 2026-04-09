// GrowDoc Companion — Training Method Definitions & Milestones

export const TRAINING_METHODS = [
  {
    id: 'none', name: 'No Training', difficulty: 0,
    description: 'Let the plant grow naturally. Best for beginners or autoflowers.',
    impact: { yield: 1, quality: 3, terpenes: 3 },
    milestones: []
  },
  {
    id: 'lst', name: 'LST (Low Stress Training)', difficulty: 1,
    description: 'Bend and tie branches to create an even canopy. Low risk, high reward.',
    impact: { yield: 4, quality: 3, terpenes: 3 },
    milestones: [
      { id: 'lst-start', name: 'Start LST', triggerStage: 'early-veg', triggerDay: 14, taskTitle: 'Start LST — bend main stem 90°', taskDetail: 'Gently bend the main stem and secure with plant ties. Aim for the top to be level with the lower branches.' },
      { id: 'lst-adjust', name: 'Adjust ties', triggerStage: 'late-veg', triggerDay: 7, taskTitle: 'Adjust LST ties', taskDetail: 'Re-tie branches that have grown up. Keep canopy level.' },
    ]
  },
  {
    id: 'top-lst', name: 'Top + LST', difficulty: 2,
    description: 'Top the plant at node 4-5, then LST the resulting branches. Two main colas become many.',
    impact: { yield: 5, quality: 3, terpenes: 3 },
    milestones: [
      { id: 'top', name: 'Top at node 4-5', triggerStage: 'early-veg', triggerDay: 14, taskTitle: 'Top the plant', taskDetail: 'Cut the main stem above the 4th or 5th node. Use clean, sharp scissors. The two resulting branches will become your new mains.' },
      { id: 'top-lst-start', name: 'Start LST on new tops', triggerStage: 'early-veg', triggerDay: 21, taskTitle: 'Start LST on topped branches', taskDetail: 'The two new tops should be growing. Start bending them outward.' },
      { id: 'top-defol', name: 'Light defoliation', triggerStage: 'transition', triggerDay: 3, taskTitle: 'Pre-flower defoliation', taskDetail: 'Remove large fan leaves blocking bud sites. Max 20% removal.' },
    ]
  },
  {
    id: 'mainline', name: 'Mainline (Manifold)', difficulty: 3,
    description: 'Symmetrical manifold creating 8-16 even colas. Requires patience but produces uniform buds.',
    impact: { yield: 5, quality: 4, terpenes: 3 },
    milestones: [
      { id: 'main-top1', name: 'First topping', triggerStage: 'early-veg', triggerDay: 14, taskTitle: 'First mainline topping', taskDetail: 'Top above node 3. Remove all growth below. You want only two branches.' },
      { id: 'main-top2', name: 'Second topping', triggerStage: 'late-veg', triggerDay: 7, taskTitle: 'Second mainline topping', taskDetail: 'Top each of the two branches. Now you have 4 mains.' },
      { id: 'main-top3', name: 'Third topping (optional)', triggerStage: 'late-veg', triggerDay: 14, taskTitle: 'Third topping for 8 colas', taskDetail: 'Top each of the 4 branches for 8 even colas.' },
    ]
  },
  {
    id: 'scrog', name: 'ScrOG (Screen of Green)', difficulty: 3,
    description: 'Weave branches through a horizontal screen for maximum canopy spread and light utilization.',
    impact: { yield: 5, quality: 4, terpenes: 3 },
    milestones: [
      { id: 'scrog-install', name: 'Install screen', triggerStage: 'late-veg', triggerDay: 1, taskTitle: 'Install ScrOG screen', taskDetail: 'Place the screen 20-30cm above the pot. Use 5x5cm grid openings.' },
      { id: 'scrog-tuck', name: 'Begin tucking', triggerStage: 'late-veg', triggerDay: 7, taskTitle: 'Start tucking branches', taskDetail: 'As branches grow through the screen, tuck them under and guide horizontally.' },
      { id: 'scrog-fill', name: 'Screen 70% filled', triggerStage: 'late-veg', triggerDay: 18, taskTitle: 'Check screen fill — flip soon', taskDetail: 'Screen should be ~70% full. Time to flip to 12/12. Stretch will fill the rest.' },
    ]
  },
  {
    id: 'lollipop', name: 'Lollipop Only', difficulty: 1,
    description: 'Remove lower growth in early flower to focus energy on top bud sites.',
    impact: { yield: 3, quality: 4, terpenes: 3 },
    milestones: [
      { id: 'lollipop', name: 'Lollipop bottom 1/3', triggerStage: 'early-flower', triggerDay: 3, taskTitle: 'Lollipop — remove lower growth', taskDetail: 'Remove all growth on the bottom 1/3 of the plant. Small branches, fan leaves, and popcorn sites.' },
    ]
  },
];

/**
 * getMethodById(methodId) — Get a training method by ID.
 */
export function getMethodById(methodId) {
  return TRAINING_METHODS.find(m => m.id === methodId) || null;
}

/**
 * generateMilestones(methodId) — Returns milestone array for the selected method.
 */
export function generateMilestones(methodId) {
  const method = getMethodById(methodId);
  if (!method) return [];
  return method.milestones.map(m => ({
    ...m,
    completed: false,
    completedDate: null,
  }));
}
