const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate } = require('../../middlewares/auth');
const { validateCompany } = require('../../middlewares/tenant');
const { success } = require('../../utils/response');
const TrainerService = require('../../services/TrainerService');

router.use(authenticate);
router.param('companyId', validateCompany);

router.get('/', async (req, res, next) => {
  try {
    const trainers = await TrainerService.list(req.params.companyId, req.query.branchId);
    return success(res, { trainers });
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const trainer = await TrainerService.create(req.userId, req.params.companyId, req.body.branch_id, req.body);
    return success(res, { trainer }, 'Trainer created', 201);
  } catch (e) { next(e); }
});

router.patch('/:trainerId', async (req, res, next) => {
  try {
    const trainer = await TrainerService.update(req.userId, req.params.companyId, req.params.trainerId, req.body);
    return success(res, { trainer }, 'Trainer updated');
  } catch (e) { next(e); }
});

router.delete('/:trainerId', async (req, res, next) => {
  try {
    const trainer = await TrainerService.remove(req.userId, req.params.companyId, req.params.trainerId);
    return success(res, { trainer }, 'Trainer deleted');
  } catch (e) { next(e); }
});

module.exports = router;
