import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from './UI'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

const isChunkError = (error: Error) =>
  /dynamically imported module|Loading chunk|Importing a module script failed|Failed to fetch dynamically imported module/i.test(
    error.message,
  )

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Fallo al cargar una sección', error, info.componentStack)
  }

  private reload = () => {
    window.location.reload()
  }

  private retry = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    const chunk = isChunkError(error)

    return (
      <div className="route-error" role="alert">
        <h2>{chunk ? 'No se pudo cargar esta sección' : 'Algo ha fallado'}</h2>
        <p>
          {chunk
            ? 'La conexión se cortó al descargar el módulo de la página. Vuelve a intentarlo o recarga para recuperarlo.'
            : 'Se ha producido un error inesperado al mostrar esta pantalla.'}
        </p>
        <div className="route-error__actions">
          {chunk ? (
            <Button icon="refresh" onClick={this.reload}>
              Recargar la página
            </Button>
          ) : null}
          <Button onClick={this.retry} variant="secondary">
            Reintentar
          </Button>
        </div>
      </div>
    )
  }
}
