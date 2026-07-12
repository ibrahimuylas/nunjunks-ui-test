const demoSupportTypes = Object.freeze(
  [
    { value: 'safe-accommodation', text: 'Somewhere safe to stay' },
    { value: 'personal-safety', text: 'Help to stay safe' },
    { value: 'essential-items', text: 'Food and essential items' },
    { value: 'wellbeing', text: 'Health and wellbeing support' },
  ].map(Object.freeze),
);
const demoSupportDescriptionCharacterLimit = 500;

function isDemoSupportType(value) {
  return typeof value === 'string' && demoSupportTypes.some((type) => type.value === value);
}

module.exports = {
  demoSupportDescriptionCharacterLimit,
  demoSupportTypes,
  isDemoSupportType,
};
