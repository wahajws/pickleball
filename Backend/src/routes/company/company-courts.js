const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate } = require('../../middlewares/auth');
const { validateCompany } = require('../../middlewares/tenant');
const { success } = require('../../utils/response');
const CourtService = require('../../services/CourtService');

router.use(authenticate);
router.param('companyId', validateCompany);

// GET /api/admin/companies/:companyId/courts?branchId=...
router.get('/', async (req, res, next) => {
  try {
    const courts = await CourtService.list(req.params.companyId, req.query.branchId);
    return success(res, { courts });
  } catch (e) { next(e); }
});

// POST /api/admin/companies/:companyId/courts
router.post('/', async (req, res, next) => {
  try {
    const court = await CourtService.create(req.userId, req.params.companyId, req.body.branch_id, req.body);
    return success(res, { court }, 'Court created', 201);
  } catch (e) { next(e); }
});

// PATCH /api/admin/companies/:companyId/courts/:courtId
router.patch('/:courtId', async (req, res, next) => {
  try {
    const court = await CourtService.update(req.userId, req.params.companyId, req.params.courtId, req.body);
    return success(res, { court }, 'Court updated');
  } catch (e) { next(e); }
});

// DELETE /api/admin/companies/:companyId/courts/:courtId
router.delete('/:courtId', async (req, res, next) => {
  try {
    const court = await CourtService.remove(req.userId, req.params.companyId, req.params.courtId);
    return success(res, { court }, 'Court deleted');
  } catch (e) { next(e); }
});

module.exports = router;
