import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

let sdk: NodeSDK | null = null;

export function startTracing(): void {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const prometheusExporter = new PrometheusExporter(
    {
      port: 9464,
      endpoint: '/metrics',
    },
    () => {
      console.log('Prometheus metrics available at http://localhost:9464/metrics');
    },
  );

  sdk = new NodeSDK({
    serviceName: process.env.OTEL_SERVICE_NAME ?? 'backend-api',
    metricReader: prometheusExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-http': {
          ignoreIncomingRequestHook: (req) => {
            return req.url === '/health' || req.url === '/metrics';
          },
        },
      }),
    ],
  });

  sdk.start();
}

export function stopTracing(): Promise<void> {
  if (sdk) {
    return sdk.shutdown();
  }
  return Promise.resolve();
}
