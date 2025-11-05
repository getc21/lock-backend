import express from 'express';
import * as locationController from '../controllers/location.controller';
import { authenticateToken } from '../middleware/auth';
import { validateStoreAccessIfProvided } from '../middleware/storePermission';
import { validateLocationStoreAccess } from '../middleware/resourceStoreValidation';

const router = express.Router();

router.use(authenticateToken);

router.get('/', validateStoreAccessIfProvided, locationController.getAllLocations);
router.get('/:id', validateLocationStoreAccess, locationController.getLocation);
router.post('/', validateStoreAccessIfProvided, locationController.createLocation);
router.patch('/:id', validateLocationStoreAccess, locationController.updateLocation);
router.delete('/:id', validateLocationStoreAccess, locationController.deleteLocation);

export default router;
