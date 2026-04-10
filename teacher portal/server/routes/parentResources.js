import express from 'express';
import {
  getParentChildAssignments,
  getParentChildStudyMaterials,
} from '../controllers/teacherController.js';

const router = express.Router();

router.get('/my-child-assignments', getParentChildAssignments);
router.get('/my-child-study-materials', getParentChildStudyMaterials);

export default router;
