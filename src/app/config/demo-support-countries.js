const demoSupportCountries = Object.freeze(
  [
    { value: 'england', text: 'England' },
    { value: 'northern-ireland', text: 'Northern Ireland' },
    { value: 'scotland', text: 'Scotland' },
    { value: 'wales', text: 'Wales' },
  ].map(Object.freeze),
);

function isDemoSupportCountry(value) {
  return (
    typeof value === 'string' && demoSupportCountries.some((country) => country.value === value)
  );
}

module.exports = { demoSupportCountries, isDemoSupportCountry };
