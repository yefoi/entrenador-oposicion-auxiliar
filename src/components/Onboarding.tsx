import { useState } from 'react'
import type { IconName } from '../components/Icons'
import { Icon } from '../components/Icons'
import { Button, Modal } from '../components/UI'
import { markOnboardingSeen } from '../lib/storage'

interface OnboardingStep {
  eyebrow: string
  title: string
  description: string
  icon: IconName
}

const steps: OnboardingStep[] = [
  {
    eyebrow: '01 · Método',
    title: 'Estudia por ciclos, no por horas',
    description:
      'Alterna teoría, práctica, corrección y repaso. El entrenador te ayuda a convertir cada error en la siguiente pregunta que conviene estudiar.',
    icon: 'target',
  },
  {
    eyebrow: '02 · Privacidad',
    title: 'Tu progreso vive en este navegador',
    description:
      'No hay registro ni servidor: todo se guarda en localStorage. Exporta una copia desde Ajustes antes de cambiar de dispositivo.',
    icon: 'lock',
  },
  {
    eyebrow: '03 · Empezar',
    title: 'Empieza con una sesión corta',
    description:
      'Configura tu fecha objetivo y entra al temario. La práctica adaptativa prioriza lo nuevo, lo pendiente y tus temas débiles.',
    icon: 'play',
  },
]

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const current = steps[step]
  const finish = () => {
    markOnboardingSeen()
    onComplete()
  }
  const next = () => {
    if (step === steps.length - 1) finish()
    else setStep((value) => value + 1)
  }

  return (
    <Modal title="Bienvenido a Plaza TAI" onClose={finish}>
      <div className="onboarding">
        <div className="onboarding-progress" aria-label={`Paso ${step + 1} de ${steps.length}`}>
          {steps.map((item, index) => (
            <span
              className={index <= step ? 'is-active' : ''}
              key={item.eyebrow}
            />
          ))}
        </div>
        <div className="onboarding-icon">
          <Icon name={current.icon} size={24} />
        </div>
        <span className="section-kicker">{current.eyebrow}</span>
        <h2>{current.title}</h2>
        <p>{current.description}</p>
        <div className="modal-actions onboarding-actions">
          <button className="text-button" onClick={finish} type="button">
            Saltar
          </button>
          <Button icon={step === steps.length - 1 ? 'check' : 'arrow'} onClick={next}>
            {step === steps.length - 1 ? 'Comenzar' : 'Siguiente'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
