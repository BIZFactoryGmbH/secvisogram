import React from 'react'
import CsafTab from './View/CsafTab'
import FormEditorTab from './View/FormEditorTab'
import JsonEditorTab from './View/JsonEditorTab'
import LoadingIndicator from './View/LoadingIndicator'
import PreviewTab from './View/PreviewTab'
import Reducer from './View/Reducer'
import Alert from './View/shared/Alert'
import useDebounce from './View/shared/useDebounce'

/**
 * @param {{
 *  isLoading: boolean
 *  isSaving: boolean
 *  isTabLocked: boolean
 *  errors: import('../shared/validationTypes').ValidationError[]
 *  data: {
 *    doc: unknown
 *  } | null
 *  activeTab: 'EDITOR' | 'SOURCE' | 'PREVIEW' | 'CSAF-JSON'
 *  alert?: {
 *    confirmLabel: string
 *    cancelLabel: string
 *    label: string
 *    description: string
 *    onConfirm(): void
 *    onCancel(): void
 *  } | null
 *  stripResult: React.ComponentProps<typeof CsafTab>['stripResult']
 *  strict: boolean
 *  onSetStrict(strict: boolean): void
 *  onDownload(doc: {}): void
 *  onOpen(file: File): Promise<void | {}>
 *  onChangeTab(tab: 'EDITOR' | 'SOURCE' | 'PREVIEW' | 'CSAF-JSON', document: {}): void
 *  onValidate(document: {}): void
 *  onNewDocMin(): Promise<void | {}>
 *  onNewDocMax(): Promise<void | {}>
 *  onStrip(document: {}): void
 *  onExportCSAF(doc: {}): void
 *  onExportHTML(html: string, doc: {}): void
 *  onLockTab(): void
 *  onUnlockTab(): void
 * }} props
 */
function View({
  activeTab,
  isLoading,
  isSaving,
  isTabLocked,
  errors,
  data,
  alert,
  stripResult,
  strict,
  onSetStrict,
  onDownload,
  onOpen,
  onChangeTab,
  onValidate,
  onNewDocMin,
  onNewDocMax,
  onStrip,
  onExportCSAF,
  onExportHTML,
  onLockTab,
  onUnlockTab,
}) {
  const originalValues = React.useMemo(() => ({ doc: data?.doc ?? null }), [
    data,
  ])
  const [{ ...state }, dispatch] = React.useReducer(Reducer, {
    formValues: originalValues,
  })
  const formValues = /** @type {import('./shared/FormValues').default} */ (state.formValues)
  const debouncedChangedDoc = useDebounce(formValues.doc, 300)
  const onUpdate = /** @type {((update: {}) => void) & ((dataPath: string, update: {}) => void)} */ (React.useCallback(
    (/** @type {any} */ newValue, /** @type {any?} */ update) => {
      if (typeof newValue === 'string') {
        dispatch({
          type: 'CHANGE_FORM_DOC',
          dataPath: newValue,
          timestamp: new Date(),
          update: update,
        })
      } else {
        dispatch({
          type: 'CHANGE_FORM_DOC',
          timestamp: new Date(),
          update: newValue,
        })
      }
    },
    []
  ))
  const onResetDoc = React.useCallback((
    /** @type {unknown} */ newSerializedDoc
  ) => {
    dispatch({ type: 'RESET_FORM_DOC', doc: newSerializedDoc })
  }, [])

  React.useEffect(() => {
    dispatch({ type: 'RESET_FORM', values: originalValues })
  }, [originalValues])

  React.useEffect(() => {
    /**
     * @param {BeforeUnloadEvent} e
     */
    const handler = (e) => {
      if (originalValues !== formValues) e.preventDefault()
    }

    window.addEventListener('beforeunload', handler)
    return () => {
      window.removeEventListener('beforeunload', handler)
    }
  }, [originalValues, formValues])

  React.useEffect(() => {
    onValidate(debouncedChangedDoc)
  }, [debouncedChangedDoc, onValidate])

  const { doc } = formValues

  const tabButtonProps = React.useCallback(
    (/** @type {typeof activeTab} */ tab) => {
      return {
        type: /** @type {'button'} */ ('button'),
        disabled: Boolean(activeTab !== tab && isTabLocked),
        className:
          'ml-3 px-2 pb-2 pt-1 ' +
          (activeTab === tab
            ? 'bg-white text-blue-400'
            : isTabLocked
            ? 'bg-blue-100 text-white'
            : 'bg-blue-400 text-white hover:bg-white hover:text-blue-400'),
        onClick() {
          onChangeTab(tab, formValues.doc)
        },
      }
    },
    [activeTab, onChangeTab, formValues.doc, isTabLocked]
  )

  const onStripCallback = React.useCallback(() => {
    onStrip(formValues.doc)
  }, [formValues.doc, onStrip])

  const onExportCSAFCallback = React.useCallback(() => {
    onExportCSAF(formValues.doc)
  }, [formValues.doc, onExportCSAF])

  return (
    <>
      {alert ? <Alert {...alert} /> : null}
      <div className="mx-auto w-full h-screen flex flex-col">
        <div className="bg-gray-500 flex justify-between items-baseline pt-2">
          <div>
            <button {...tabButtonProps('EDITOR')}>Form Editor</button>
            <button {...tabButtonProps('SOURCE')}>JSON Editor</button>
            <button {...tabButtonProps('PREVIEW')}>Preview</button>
            <button {...tabButtonProps('CSAF-JSON')}>CSAF Document</button>
          </div>
          <h1 className="mr-3 text-2xl text-blue-200 font-mono">Secvisogram</h1>
        </div>
        <div
          className="relative overflow-auto h-full bg-gray-500"
          key={activeTab}
        >
          {doc ? (
            <>
              {activeTab === 'EDITOR' ? (
                <FormEditorTab
                  formValues={formValues}
                  validationErrors={errors}
                  onUpdate={onUpdate}
                  onOpen={onOpen}
                  onDownload={onDownload}
                  onNewDocMin={onNewDocMin}
                  onNewDocMax={onNewDocMax}
                />
              ) : activeTab === 'SOURCE' ? (
                <JsonEditorTab
                  formValues={formValues}
                  validationErrors={errors}
                  strict={strict}
                  onSetStrict={onSetStrict}
                  onChange={onResetDoc}
                  onOpen={onOpen}
                  onDownload={onDownload}
                  onNewDocMin={onNewDocMin}
                  onNewDocMax={onNewDocMax}
                  onLockTab={onLockTab}
                  onUnlockTab={onUnlockTab}
                />
              ) : activeTab === 'PREVIEW' ? (
                <PreviewTab
                  formValues={formValues}
                  validationErrors={errors}
                  onExport={onExportHTML}
                />
              ) : activeTab === 'CSAF-JSON' ? (
                <CsafTab
                  stripResult={stripResult}
                  onStrip={onStripCallback}
                  onExport={onExportCSAFCallback}
                />
              ) : null}
            </>
          ) : null}
        </div>
      </div>
      {isLoading ? (
        <LoadingIndicator label="Loading data ..." />
      ) : isSaving ? (
        <LoadingIndicator label="Saving data ..." />
      ) : null}
    </>
  )
}

export default View