const journeyService = require('../services/journey-service');
const { validateDateOfBirth } = require('../validators/date-of-birth-validator');
const { validateFullName } = require('../validators/full-name-validator');
const { personalDetailsPageViewModel } = require('../view-models/personal-details-page-view-model');

function showPersonalDetails(req, res) {
  if (!journeyService.hasAnswer(req.session, 'hasFarmingBusiness')) {
    return res.redirect('/business-type');
  }

  if (journeyService.getAnswers(req.session).hasFarmingBusiness === 'yes') {
    return res.redirect('/business-details');
  }

  const answers = journeyService.getAnswers(req.session);
  return res.render('pages/full-name.njk', personalDetailsPageViewModel({ answers }));
}

function submitPersonalDetails(req, res) {
  if (!journeyService.hasAnswer(req.session, 'hasFarmingBusiness')) {
    return res.redirect('/business-type');
  }

  if (journeyService.getAnswers(req.session).hasFarmingBusiness === 'yes') {
    return res.redirect('/business-details');
  }

  const fullNameValidation = validateFullName(req.body.fullName);
  const dateOfBirthValidation = validateDateOfBirth(req.body);
  const errors = {
    ...fullNameValidation.errors,
    ...dateOfBirthValidation.errors,
  };
  const answers = journeyService.getAnswers(req.session);

  if (!fullNameValidation.isValid || !dateOfBirthValidation.isValid) {
    return res.status(400).render(
      'pages/full-name.njk',
      personalDetailsPageViewModel({
        answers: {
          ...answers,
          fullName: req.body.fullName,
          dateOfBirth: dateOfBirthValidation.value,
        },
        errors,
      }),
    );
  }

  journeyService.saveAnswer(req.session, 'fullName', fullNameValidation.value);
  journeyService.saveAnswer(req.session, 'dateOfBirth', dateOfBirthValidation.value);
  return res.redirect(journeyService.getNextPath('personalDetails', req.session));
}

module.exports = {
  showPersonalDetails,
  submitPersonalDetails,
};
