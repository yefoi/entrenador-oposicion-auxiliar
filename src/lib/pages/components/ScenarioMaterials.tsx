import { useId, useState } from 'react'
import type { Scenario, ScenarioMaterial } from '../../../domain/types'
import { Icon } from '../../../components/Icons'

interface ScenarioMaterialsProps {
  scenario: Scenario
  /**
   * En el simulacro los materiales arrancan plegados para no empujar la
   * pregunta fuera de la pantalla, pero tienen que estar a un clic: son la
   * unica fuente para responder.
   */
  defaultOpen?: boolean
}

function Material({ material }: { material: ScenarioMaterial }) {
  const mono = material.kind === 'salida' || material.kind === 'tabla'
  return (
    <section className="scenario-material">
      <h3>{material.title}</h3>
      <pre className={mono ? 'scenario-material-body is-mono' : 'scenario-material-body'}>
        {material.body}
      </pre>
    </section>
  )
}

export function ScenarioMaterials({
  scenario,
  defaultOpen = false,
}: ScenarioMaterialsProps) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()

  return (
    <div className={`scenario-materials ${open ? 'is-open' : ''}`}>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        className="scenario-materials-toggle"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <Icon name={open ? 'chevron' : 'layers'} size={17} />
        <span>
          Materiales del supuesto
          <small>
            {scenario.materials.length} documentos · {scenario.title}
          </small>
        </span>
      </button>
      {open ? (
        <div className="scenario-materials-panel" id={panelId}>
          <p className="scenario-materials-context">{scenario.context}</p>
          {scenario.materials.map((material) => (
            <Material key={material.title} material={material} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
