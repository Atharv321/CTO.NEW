import { Router, Request, Response } from 'express';
import { locationService } from '../services/locationService';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Get all locations
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const offset = (page - 1) * limit;

    const result = await locationService.getLocations({ page, limit, offset });

    res.json(result);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get location by ID
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const location = await locationService.getLocationById(req.params.id);

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json(location);
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create location
router.post(
  '/',
  authenticate,
  authorize('admin', 'manager'),
  validateRequest([
    { field: 'name', type: 'string', required: true, minLength: 1, maxLength: 255 },
    { field: 'description', type: 'string', maxLength: 1000 },
  ]),
  async (req: Request, res: Response) => {
    try {
      // Check for duplicate location name
      const existing = await locationService.getLocationByName(req.body.name);
      if (existing) {
        return res.status(409).json({ error: 'Location with this name already exists' });
      }

      const location = await locationService.createLocation({
        name: req.body.name,
        description: req.body.description,
      });

      res.status(201).json(location);
    } catch (error) {
      console.error('Error creating location:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update location
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'manager'),
  validateRequest([
    { field: 'name', type: 'string', maxLength: 255 },
    { field: 'description', type: 'string', maxLength: 1000 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const location = await locationService.updateLocation(req.params.id, {
        name: req.body.name,
        description: req.body.description,
      });

      if (!location) {
        return res.status(404).json({ error: 'Location not found' });
      }

      res.json(location);
    } catch (error) {
      console.error('Error updating location:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete location
router.delete('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const deleted = await locationService.deleteLocation(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.status(204).send();
  } catch (error: any) {
    if (error.code === '23503') {
      // Foreign key constraint violation
      return res.status(409).json({ error: 'Cannot delete location with associated stock' });
    }
    console.error('Error deleting location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
