import { FileCheck, ArrowRight, Shield, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react';
import { Layout } from '../../../components/layout/Layout';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Section } from '../../../components/layout/Section';
import { roleDisplayMap } from '@/app/components/lib/roleDisplayMap';

export default function MajlisENazr() {
  const responsibilities = [
    'Reviewing submitted kalam',
    'Evaluating theological and thematic consistency',
    'Confirming alignment with institutional purpose',
    'Authorizing progression into structured production'
  ];

  const reviewCriteria = [
    {
      label: 'Thematic clarity',
      description: 'Content purpose and devotional focus are coherent'
    },
    {
      label: 'Devotional integrity',
      description: 'Alignment with traditional Islamic and Sufi principles'
    },
    {
      label: 'Linguistic coherence',
      description: 'Language quality and structural readability'
    },
    {
      label: 'Structural readiness',
      description: 'Suitability for musical adaptation and production'
    }
  ];

  const reviewSteps = [
    { label: 'Submission', icon: FileCheck },
    { label: 'Editorial Review', icon: Shield },
    { label: 'Approval or Revision', icon: AlertCircle },
    { label: 'Production Authorization', icon: CheckCircle }
  ];

  const authorityBoundaries = [
    {
      action: 'Does not manage studio execution',
      clarification: 'Production scheduling falls under Production Oversight'
    },
    {
      action: 'Does not assign royalties',
      clarification: 'Economic distribution is handled by the royalty framework'
    },
    {
      action: 'Does not lock metadata',
      clarification: 'Registry validation is performed by Diwan-e-Amanat'
    },
    {
      action: 'Does not authorize publication',
      clarification: 'Release activation requires registry confirmation'
    }
  ];

  const integrityPrinciples = [
    'Content enters production intentionally.',
    'Thematic direction remains coherent.',
    'Institutional continuity is preserved.'
  ];

  return (
    <Layout>
      <Section className="pt-24 pb-12">
        <PageContainer>
          <div className="max-w-4xl">
            <h1 className="text-5xl font-bold text-white mb-2">
              Majlis-e-Nazr
            </h1>
            <p className="text-xl text-amber-400/90 mb-8 border-b border-amber-400/20 pb-4 inline-block">
              {roleDisplayMap.editor.mystical}
            </p>

            <div className="max-w-2xl">
              <p className="text-neutral-300 leading-relaxed">
                The Editorial Council governs content authorization within SufiPulse.
                No kalam enters production without formal review and approval.
              </p>
            </div>
          </div>
        </PageContainer>
      </Section>

      <Section className="py-12">
        <PageContainer>
          <div className="max-w-4xl">
            <h2 className="text-3xl font-bold text-white mb-6">
              Mandate & Review Authority
            </h2>

            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
              <p className="text-neutral-300 leading-relaxed mb-6">
                Majlis-e-Nazr safeguards thematic coherence and institutional alignment.
              </p>

              <p className="text-neutral-300 text-sm font-medium mb-4">
                Its responsibilities include:
              </p>

              <div className="space-y-3 mb-6">
                {responsibilities.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-2" />
                    <p className="text-neutral-300 text-sm">{item}</p>
                  </div>
                ))}
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

              <p className="text-neutral-300 leading-relaxed text-sm">
                The Council does not modify creative content.
                <br />
                It authorizes progression.
              </p>
            </div>
          </div>
        </PageContainer>
      </Section>

      <Section className="py-12">
        <PageContainer>
          <div className="max-w-4xl">
            <h2 className="text-3xl font-bold text-white mb-6">
              Scope of Review
            </h2>

            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
              <p className="text-neutral-300 text-sm font-medium mb-6">
                Editorial evaluation assesses:
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {reviewCriteria.map((criterion, idx) => (
                  <div key={idx} className="space-y-2">
                    <p className="text-white font-medium text-sm">{criterion.label}</p>
                    <p className="text-neutral-400 text-xs leading-relaxed">
                      {criterion.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

              <p className="text-neutral-300 text-sm font-medium mb-4">
                Submission outcomes:
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white text-sm font-medium">Approved</p>
                    <p className="text-neutral-400 text-xs">Moves to production assignment</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white text-sm font-medium">Returned</p>
                    <p className="text-neutral-400 text-xs">May be revised and resubmitted</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </Section>

      <Section className="py-12">
        <PageContainer>
          <div className="max-w-4xl">
            <h2 className="text-3xl font-bold text-white mb-6">
              Review Sequence
            </h2>

            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {reviewSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-4 flex-1">
                    <div className="flex flex-col items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                        <step.icon className="w-5 h-5 text-amber-400" />
                      </div>
                      <p className="text-neutral-300 text-sm text-center font-medium">
                        {step.label}
                      </p>
                    </div>
                    {idx < reviewSteps.length - 1 && (
                      <ArrowRight className="hidden md:block w-5 h-5 text-neutral-600 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PageContainer>
      </Section>

      <Section className="py-12">
        <PageContainer>
          <div className="max-w-4xl">
            <h2 className="text-3xl font-bold text-white mb-6">
              Authority Boundaries
            </h2>

            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
              <p className="text-neutral-300 text-sm font-medium mb-6">
                Majlis-e-Nazr:
              </p>

              <div className="space-y-6">
                {authorityBoundaries.map((boundary, idx) => (
                  <div key={idx}>
                    <p className="text-white text-sm font-medium mb-1">
                      {boundary.action}
                    </p>
                    <p className="text-neutral-400 text-xs leading-relaxed">
                      {boundary.clarification}
                    </p>
                  </div>
                ))}
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

              <p className="text-neutral-300 text-sm leading-relaxed">
                Its authority concludes at production authorization.
              </p>
            </div>
          </div>
        </PageContainer>
      </Section>

      <Section className="py-12">
        <PageContainer>
          <div className="max-w-4xl">
            <h2 className="text-3xl font-bold text-white mb-6">
              Institutional Integrity
            </h2>

            <div className="bg-neutral-900/30 border border-neutral-800 rounded-lg p-8">
              <p className="text-neutral-300 text-sm font-medium mb-6">
                Editorial review ensures:
              </p>

              <div className="space-y-3 mb-6">
                {integrityPrinciples.map((principle, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-2" />
                    <p className="text-neutral-300 text-sm">{principle}</p>
                  </div>
                ))}
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent my-6" />

              <p className="text-neutral-300 text-sm leading-relaxed">
                Review protects mission before momentum.
              </p>
            </div>
          </div>
        </PageContainer>
      </Section>
    </Layout>
  );
}
