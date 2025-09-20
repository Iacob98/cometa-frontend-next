'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, AlertCircle, FileText, Users, MapPin } from 'lucide-react';
import {
  PROJECT_PREPARATION_PHASES,
  type ProjectPreparationPhase,
  type ProjectPhaseProgress,
  type PhaseValidationResult,
} from '@/types/project-preparation';

interface PhaseManagerProps {
  projectId: string;
  currentPhase: number;
  phaseProgress: ProjectPhaseProgress;
  onPhaseAdvance: (fromPhase: number, toPhase: number) => Promise<void>;
  onPhaseEdit: (phase: number) => void;
}

export function PhaseManager({
  projectId,
  currentPhase,
  phaseProgress,
  onPhaseAdvance,
  onPhaseEdit,
}: PhaseManagerProps) {
  const [validationResults, setValidationResults] = useState<Map<number, PhaseValidationResult>>(new Map());
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    validateCurrentPhase();
  }, [currentPhase]);

  const validateCurrentPhase = async () => {
    setIsValidating(true);
    try {
      // In a real implementation, this would call your API
      const mockValidation: PhaseValidationResult = {
        isValid: phaseProgress.completedPhases.includes(currentPhase),
        missingRequirements: [],
        warnings: [],
        canAdvance: phaseProgress.completedPhases.includes(currentPhase),
      };

      setValidationResults(prev => new Map(prev.set(currentPhase, mockValidation)));
    } catch (error) {
      console.error('Phase validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const getPhaseStatus = (phase: ProjectPreparationPhase): 'completed' | 'current' | 'blocked' | 'pending' => {
    if (phaseProgress.completedPhases.includes(phase.phase)) {
      return 'completed';
    }
    if (phase.phase === currentPhase) {
      return 'current';
    }
    if (phaseProgress.blockedPhases.includes(phase.phase)) {
      return 'blocked';
    }
    return 'pending';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'current':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'blocked':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'current':
        return 'bg-blue-500';
      case 'blocked':
        return 'bg-red-500';
      default:
        return 'bg-gray-300';
    }
  };

  const canAdvancePhase = (phase: ProjectPreparationPhase): boolean => {
    const validation = validationResults.get(phase.phase);
    return validation?.canAdvance ?? false;
  };

  const handleAdvancePhase = async (phase: ProjectPreparationPhase) => {
    try {
      await onPhaseAdvance(phase.phase, phase.phase + 1);
    } catch (error) {
      console.error('Failed to advance phase:', error);
    }
  };

  const getPhaseIcon = (phase: ProjectPreparationPhase) => {
    // Return appropriate icon based on phase type
    switch (phase.phase) {
      case 0:
      case 1:
        return <FileText className="h-5 w-5" />;
      case 2:
        return <MapPin className="h-5 w-5" />;
      case 3:
      case 4:
        return <Users className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Project Preparation Progress</CardTitle>
          <CardDescription>
            Phase {currentPhase} of {PROJECT_PREPARATION_PHASES.length - 1} |
            {phaseProgress.completedPhases.length} phases completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress
              value={phaseProgress.overallProgress}
              className="w-full h-3"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{phaseProgress.overallProgress}% Complete</span>
              <span>
                Est. completion: {phaseProgress.estimatedCompletion.toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Timeline */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Project Phases</h3>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

          {PROJECT_PREPARATION_PHASES.map((phase, index) => {
            const status = getPhaseStatus(phase);
            const validation = validationResults.get(phase.phase);

            return (
              <div key={phase.phase} className="relative flex items-start space-x-4 pb-8">
                {/* Timeline dot */}
                <div className={`
                  relative flex items-center justify-center w-12 h-12 rounded-full border-4 border-white shadow-sm z-10
                  ${getStatusColor(status)}
                `}>
                  <div className="text-white font-semibold text-sm">
                    {phase.phase}
                  </div>
                </div>

                {/* Phase card */}
                <Card className={`flex-1 ${status === 'current' ? 'ring-2 ring-blue-500' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getPhaseIcon(phase)}
                        <CardTitle className="text-base">{phase.name}</CardTitle>
                        <Badge variant={status === 'completed' ? 'default' : 'secondary'}>
                          {status}
                        </Badge>
                      </div>
                      {getStatusIcon(status)}
                    </div>
                    <CardDescription>{phase.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Requirements */}
                      <div>
                        <h5 className="text-sm font-medium mb-1">Required Documents:</h5>
                        <div className="flex flex-wrap gap-1">
                          {phase.requiredDocuments.map(doc => (
                            <Badge key={doc} variant="outline" className="text-xs">
                              {doc.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Dependencies */}
                      {phase.dependencies.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium mb-1">Dependencies:</h5>
                          <div className="flex gap-1">
                            {phase.dependencies.map(dep => (
                              <Badge key={dep} variant="outline" className="text-xs">
                                Phase {dep}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Duration */}
                      <div className="text-sm text-muted-foreground">
                        Estimated duration: {phase.estimatedDuration} hours
                      </div>

                      {/* Validation errors */}
                      {validation && validation.missingRequirements.length > 0 && (
                        <div className="space-y-1">
                          <h5 className="text-sm font-medium text-red-600">Missing Requirements:</h5>
                          <ul className="text-sm text-red-600 list-disc list-inside">
                            {validation.missingRequirements.map((req, i) => (
                              <li key={i}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Validation warnings */}
                      {validation && validation.warnings.length > 0 && (
                        <div className="space-y-1">
                          <h5 className="text-sm font-medium text-yellow-600">Warnings:</h5>
                          <ul className="text-sm text-yellow-600 list-disc list-inside">
                            {validation.warnings.map((warning, i) => (
                              <li key={i}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPhaseEdit(phase.phase)}
                        >
                          View Details
                        </Button>

                        {status === 'current' && canAdvancePhase(phase) && (
                          <Button
                            size="sm"
                            onClick={() => handleAdvancePhase(phase)}
                            disabled={isValidating}
                          >
                            {phase.autoAdvance ? 'Auto Advance' : 'Advance Phase'}
                          </Button>
                        )}

                        {status === 'current' && !canAdvancePhase(phase) && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled
                          >
                            Complete Requirements
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}