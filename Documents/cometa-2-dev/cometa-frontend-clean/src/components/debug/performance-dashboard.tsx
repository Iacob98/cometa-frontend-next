"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Zap,
  Clock,
  TrendingUp,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { performanceMonitor } from '@/lib/performance-monitor';

interface WebVitalScore {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  threshold: { good: number; poor: number };
  unit: string;
}

const PerformanceDashboard: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [webVitals, setWebVitals] = useState<WebVitalScore[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updatePerformanceData = () => {
      const report = performanceMonitor.getPerformanceReport();
      setPerformanceData(report);

      const vitals: WebVitalScore[] = [
        {
          name: 'LCP',
          value: report.webVitals.LCP,
          rating: getRating('LCP', report.webVitals.LCP),
          threshold: { good: 2500, poor: 4000 },
          unit: 'ms'
        },
        {
          name: 'FID',
          value: report.webVitals.FID,
          rating: getRating('FID', report.webVitals.FID),
          threshold: { good: 100, poor: 300 },
          unit: 'ms'
        },
        {
          name: 'CLS',
          value: report.webVitals.CLS,
          rating: getRating('CLS', report.webVitals.CLS),
          threshold: { good: 0.1, poor: 0.25 },
          unit: ''
        },
        {
          name: 'FCP',
          value: report.webVitals.FCP,
          rating: getRating('FCP', report.webVitals.FCP),
          threshold: { good: 1800, poor: 3000 },
          unit: 'ms'
        },
        {
          name: 'TTFB',
          value: report.webVitals.TTFB,
          rating: getRating('TTFB', report.webVitals.TTFB),
          threshold: { good: 800, poor: 1800 },
          unit: 'ms'
        }
      ];

      setWebVitals(vitals);
    };

    updatePerformanceData();
    const interval = setInterval(updatePerformanceData, 5000);

    return () => clearInterval(interval);
  }, []);

  const getRating = (metric: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
    const thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 }
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'good': return <CheckCircle className="w-4 h-4" />;
      case 'needs-improvement': return <AlertTriangle className="w-4 h-4" />;
      case 'poor': return <XCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === 'ms') {
      return value < 1000 ? `${value.toFixed(0)}${unit}` : `${(value / 1000).toFixed(2)}s`;
    }
    return `${value.toFixed(3)}${unit}`;
  };

  const exportPerformanceData = () => {
    const data = JSON.stringify(performanceData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Only show in development or when explicitly enabled
  if (process.env.NODE_ENV === 'production' && !isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999]">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="bg-background/80 backdrop-blur"
        >
          <Activity className="w-4 h-4 mr-2" />
          Performance
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-96 max-h-[80vh] overflow-y-auto">
      <Card className="bg-background/95 backdrop-blur border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              <CardTitle className="text-lg">Performance Monitor</CardTitle>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={exportPerformanceData}
                disabled={!performanceData}
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
              >
                ×
              </Button>
            </div>
          </div>
          <CardDescription>
            Real-time performance metrics and Web Vitals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="vitals" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="vitals">Web Vitals</TabsTrigger>
              <TabsTrigger value="navigation">Navigation</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>

            <TabsContent value="vitals" className="space-y-3">
              {webVitals.map((vital) => (
                <div key={vital.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getRatingIcon(vital.rating)}
                      <span className="font-medium">{vital.name}</span>
                    </div>
                    <Badge className={getRatingColor(vital.rating)}>
                      {vital.rating.replace('-', ' ')}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">
                      {formatValue(vital.value, vital.unit)}
                    </span>
                    <div className="flex-1">
                      <Progress
                        value={Math.min((vital.value / vital.threshold.poor) * 100, 100)}
                        className="h-2"
                      />
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Good: ≤{formatValue(vital.threshold.good, vital.unit)} •
                    Poor: >{formatValue(vital.threshold.poor, vital.unit)}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="navigation" className="space-y-3">
              {performanceData && (
                <>
                  <MetricCard
                    icon={<Clock className="w-4 h-4" />}
                    label="DNS Lookup"
                    value={performanceData.navigation.dnsLookup}
                    unit="ms"
                  />
                  <MetricCard
                    icon={<Zap className="w-4 h-4" />}
                    label="TCP Connect"
                    value={performanceData.navigation.tcpConnect}
                    unit="ms"
                  />
                  <MetricCard
                    icon={<TrendingUp className="w-4 h-4" />}
                    label="TTFB"
                    value={performanceData.navigation.ttfb}
                    unit="ms"
                  />
                  <MetricCard
                    icon={<Activity className="w-4 h-4" />}
                    label="DOM Interactive"
                    value={performanceData.navigation.domInteractive}
                    unit="ms"
                  />
                  <MetricCard
                    icon={<CheckCircle className="w-4 h-4" />}
                    label="Load Complete"
                    value={performanceData.navigation.loadComplete}
                    unit="ms"
                  />
                </>
              )}
            </TabsContent>

            <TabsContent value="resources" className="space-y-3">
              {performanceData && (
                <>
                  <MetricCard
                    icon={<Download className="w-4 h-4" />}
                    label="JS Download"
                    value={performanceData.resources.jsDownload}
                    unit="ms"
                  />
                  <MetricCard
                    icon={<Download className="w-4 h-4" />}
                    label="CSS Download"
                    value={performanceData.resources.cssDownload}
                    unit="ms"
                  />
                  <MetricCard
                    icon={<Download className="w-4 h-4" />}
                    label="Image Download"
                    value={performanceData.resources.imageDownload}
                    unit="ms"
                  />
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span>Long Tasks</span>
                      <Badge variant={performanceData.longTasks > 0 ? 'destructive' : 'secondary'}>
                        {performanceData.longTasks}
                      </Badge>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          <div className="pt-4 border-t text-xs text-muted-foreground">
            Last updated: {performanceData ? new Date(performanceData.timestamp).toLocaleTimeString() : '--'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  threshold?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, unit, threshold }) => {
  const isWarning = threshold && value > threshold;

  return (
    <div className="flex items-center justify-between p-2 rounded border">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-mono ${isWarning ? 'text-orange-600' : ''}`}>
          {value.toFixed(0)}{unit}
        </span>
        {isWarning && <AlertTriangle className="w-3 h-3 text-orange-600" />}
      </div>
    </div>
  );
};

export default PerformanceDashboard;