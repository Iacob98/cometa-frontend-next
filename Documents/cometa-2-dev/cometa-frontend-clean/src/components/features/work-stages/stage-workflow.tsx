'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Camera,
  MapPin,
  Thermometer,
  Wind,
  Upload,
  Eye,
  CheckSquare,
} from 'lucide-react';
import {
  WORK_STAGES,
  type WorkStage,
  type WorkEntry,
  type CreateWorkEntryRequest,
  type StageValidationResult,
  type WeatherData,
  type GPSCoordinate,
} from '@/types/work-stages';

interface StageWorkflowProps {
  projectId: string;
  segmentId?: string;
  houseId?: string;
  currentUserId: string;
  teamId?: string;
  onWorkEntrySubmit: (workEntry: CreateWorkEntryRequest) => Promise<void>;
  onStageSelect: (stageCode: string) => void;
}

export function StageWorkflow({
  projectId,
  segmentId,
  houseId,
  currentUserId,
  teamId,
  onWorkEntrySubmit,
  onStageSelect,
}: StageWorkflowProps) {
  const [selectedStage, setSelectedStage] = useState<WorkStage | null>(null);
  const [workEntryData, setWorkEntryData] = useState<Partial<CreateWorkEntryRequest>>({
    projectId,
    segmentId,
    houseId,
    date: new Date(),
    measurements: {},
    photos: [],
    materialUsed: [],
    toolsUsed: [],
    notes: '',
  });
  const [validation, setValidation] = useState<StageValidationResult | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [gpsLocation, setGpsLocation] = useState<GPSCoordinate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(),
          });
        },
        (error) => {
          console.error('Failed to get location:', error);
        }
      );
    }

    // Get weather data (mock implementation)
    fetchWeatherData();
  }, []);

  useEffect(() => {
    if (selectedStage) {
      validateStage();
    }
  }, [selectedStage, workEntryData, uploadedPhotos]);

  const fetchWeatherData = async () => {
    // Mock weather data - in real implementation, call weather API
    const mockWeather: WeatherData = {
      temperature: 15,
      humidity: 65,
      windSpeed: 12,
      windDirection: 180,
      precipitation: 0,
      conditions: 'partly_cloudy',
      visibility: 10,
      pressure: 1013,
      timestamp: new Date(),
    };
    setWeatherData(mockWeather);
  };

  const validateStage = () => {
    if (!selectedStage) return;

    const errors: any[] = [];
    const warnings: any[] = [];

    // Check photo requirements
    if (uploadedPhotos.length < selectedStage.requirements.minPhotos) {
      errors.push({
        field: 'photos',
        code: 'insufficient_photos',
        message: `Minimum ${selectedStage.requirements.minPhotos} photos required`,
        severity: 'error',
      });
    }

    // Check measurements
    for (const measurement of selectedStage.requirements.requiredMeasurements) {
      if (!workEntryData.measurements?.[measurement]) {
        errors.push({
          field: 'measurements',
          code: 'missing_measurement',
          message: `${measurement} measurement is required`,
          severity: 'error',
        });
      }
    }

    // Check GPS requirement
    if (selectedStage.requirements.requiredGPS && !gpsLocation) {
      errors.push({
        field: 'gps',
        code: 'missing_gps',
        message: 'GPS location is required for this stage',
        severity: 'error',
      });
    }

    // Check weather restrictions
    if (selectedStage.requirements.weatherRestrictions && weatherData) {
      for (const restriction of selectedStage.requirements.weatherRestrictions) {
        const weatherValue = getWeatherValue(restriction.condition, weatherData);
        const isViolated = checkWeatherRestriction(weatherValue, restriction);

        if (isViolated) {
          warnings.push({
            field: 'weather',
            code: 'weather_restriction',
            message: `${restriction.reason} (${restriction.condition}: ${weatherValue}${restriction.unit})`,
            canOverride: true,
          });
        }
      }
    }

    const validationResult: StageValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      canSubmit: errors.length === 0,
      estimatedDuration: selectedStage.estimatedDuration,
    };

    setValidation(validationResult);
  };

  const getWeatherValue = (condition: string, weather: WeatherData): number => {
    switch (condition) {
      case 'temperature':
        return weather.temperature;
      case 'humidity':
        return weather.humidity;
      case 'wind':
        return weather.windSpeed;
      case 'rain':
        return weather.precipitation;
      default:
        return 0;
    }
  };

  const checkWeatherRestriction = (value: number, restriction: any): boolean => {
    switch (restriction.operator) {
      case 'above':
        return value > restriction.value;
      case 'below':
        return value < restriction.value;
      case 'equals':
        return value === restriction.value;
      default:
        return false;
    }
  };

  const handleStageSelect = (stage: WorkStage) => {
    setSelectedStage(stage);
    setWorkEntryData(prev => ({
      ...prev,
      stageCode: stage.code,
    }));
    onStageSelect(stage.code);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedPhotos(prev => [...prev, ...files]);
    setWorkEntryData(prev => ({
      ...prev,
      photos: [...(prev.photos || []), ...files],
    }));
  };

  const handleMeasurementChange = (measurement: string, value: string) => {
    setWorkEntryData(prev => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [measurement]: parseFloat(value) || 0,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!selectedStage || !validation?.canSubmit) return;

    setIsSubmitting(true);
    try {
      const submitData: CreateWorkEntryRequest = {
        ...workEntryData,
        projectId,
        segmentId,
        houseId,
        stageCode: selectedStage.code,
        date: workEntryData.date || new Date(),
        photos: uploadedPhotos,
        gpsLocation,
        weatherConditions: weatherData,
        measurements: workEntryData.measurements || {},
        materialUsed: workEntryData.materialUsed || [],
        toolsUsed: workEntryData.toolsUsed || [],
        notes: workEntryData.notes || '',
      };

      await onWorkEntrySubmit(submitData);
    } catch (error) {
      console.error('Failed to submit work entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stage Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Work Stage</CardTitle>
          <CardDescription>Choose the work stage you want to document</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {WORK_STAGES.filter(stage => stage.isActive).map(stage => (
              <Card
                key={stage.code}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedStage?.code === stage.code ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleStageSelect(stage)}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">{stage.name.en}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {stage.description.en}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>{stage.estimatedDuration} min</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stage Details and Work Entry Form */}
      {selectedStage && (
        <div className="space-y-6">
          {/* Stage Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                {selectedStage.name.en}
              </CardTitle>
              <CardDescription>{selectedStage.description.en}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Requirements */}
                <div className="space-y-3">
                  <h4 className="font-medium">Requirements</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      <span className="text-sm">
                        {selectedStage.requirements.minPhotos}-{selectedStage.requirements.maxPhotos} photos
                      </span>
                    </div>
                    {selectedStage.requirements.requiredGPS && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">GPS location required</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tools and Safety */}
                <div className="space-y-3">
                  <h4 className="font-medium">Required Tools & Safety</h4>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Tools:</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedStage.requiredTools.map(tool => (
                          <Badge key={tool} variant="outline" className="text-xs">
                            {tool.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Safety:</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedStage.safetyRequirements.map(safety => (
                          <Badge key={safety} variant="secondary" className="text-xs">
                            {safety.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weather and Location Info */}
          {(weatherData || gpsLocation) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5" />
                  Environmental Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {weatherData && (
                    <>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{weatherData.temperature}°C</div>
                        <div className="text-sm text-muted-foreground">Temperature</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{weatherData.humidity}%</div>
                        <div className="text-sm text-muted-foreground">Humidity</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold flex items-center justify-center gap-1">
                          <Wind className="h-4 w-4" />
                          {weatherData.windSpeed}
                        </div>
                        <div className="text-sm text-muted-foreground">Wind (km/h)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{weatherData.precipitation}mm</div>
                        <div className="text-sm text-muted-foreground">Precipitation</div>
                      </div>
                    </>
                  )}
                </div>
                {gpsLocation && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>
                        Location: {gpsLocation.latitude.toFixed(6)}, {gpsLocation.longitude.toFixed(6)}
                        {gpsLocation.accuracy && (
                          <span className="text-muted-foreground"> (±{gpsLocation.accuracy}m)</span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Validation Alerts */}
          {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
            <div className="space-y-2">
              {validation.errors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error.message}</AlertDescription>
                </Alert>
              ))}
              {validation.warnings.map((warning, index) => (
                <Alert key={index}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{warning.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Work Entry Form */}
          <Card>
            <CardHeader>
              <CardTitle>Work Entry Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Photos */}
              <div className="space-y-3">
                <Label>Photos ({uploadedPhotos.length}/{selectedStage.requirements.maxPhotos})</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <Label
                      htmlFor="photo-upload"
                      className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      Upload Photos
                    </Label>
                    <Input
                      id="photo-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedStage.requirements.minPhotos}-{selectedStage.requirements.maxPhotos} photos required
                    </p>
                  </div>
                  {uploadedPhotos.length > 0 && (
                    <div className="space-y-2">
                      <Label>Uploaded Photos:</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {uploadedPhotos.map((photo, index) => (
                          <div key={index} className="text-sm p-2 bg-muted rounded">
                            {photo.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Measurements */}
              {selectedStage.requirements.requiredMeasurements.length > 0 && (
                <div className="space-y-3">
                  <Label>Measurements</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedStage.requirements.requiredMeasurements.map(measurement => (
                      <div key={measurement} className="space-y-2">
                        <Label htmlFor={measurement}>
                          {measurement.replace('_', ' ').toUpperCase()}
                        </Label>
                        <Input
                          id={measurement}
                          type="number"
                          step="0.01"
                          placeholder="Enter value"
                          value={workEntryData.measurements?.[measurement] || ''}
                          onChange={(e) => handleMeasurementChange(measurement, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about the work performed..."
                  value={workEntryData.notes || ''}
                  onChange={(e) => setWorkEntryData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={!validation?.canSubmit || isSubmitting}
                  className="w-full md:w-auto"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Work Entry'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}