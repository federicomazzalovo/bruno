import React, { Component } from 'react';
import isEqual from 'lodash/isEqual';
import { getAllVariables } from 'utils/collections';
import { defineCodeMirrorBrunoVariablesMode } from 'utils/common/codemirror';
import { setupAutoComplete } from 'utils/codemirror/autocomplete';
import StyledWrapper from './StyledWrapper';

const CodeMirror = require('codemirror');

class MultiLineEditor extends Component {
  constructor(props) {
    super(props);
    // Keep a cached version of the value, this cache will be updated when the
    // editor is updated, which can later be used to protect the editor from
    // unnecessary updates during the update lifecycle.
    this.cachedValue = props.value || '';
    this.editorRef = React.createRef();
    this.variables = {};
  }
  componentDidMount() {
    // Initialize CodeMirror as a single line editor
    /** @type {import("codemirror").Editor} */
    const variables = getAllVariables(this.props.collection, this.props.item);

    this.editor = CodeMirror(this.editorRef.current, {
      lineWrapping: false,
      lineNumbers: false,
      theme: this.props.theme === 'dark' ? 'monokai' : 'default',
      placeholder: this.props.placeholder,
      mode: 'brunovariables',
      brunoVarInfo: {
        variables,
        collectionUid: this.props.collection?.uid,
        store: this.props.store
      },
      scrollbarStyle: null,
      tabindex: 0,
      extraKeys: {
        Enter: () => {
          if (this.props.onRun) {
            this.props.onRun();
          }
        },
        'Ctrl-Enter': () => {
          if (this.props.onRun) {
            this.props.onRun();
          }
        },
        'Cmd-Enter': () => {
          if (this.props.onRun) {
            this.props.onRun();
          }
        },
        'Alt-Enter': () => {
          this.editor.setValue(this.editor.getValue() + '\n');
          this.editor.setCursor({ line: this.editor.lineCount(), ch: 0 });
        },
        'Shift-Enter': () => {
          this.editor.setValue(this.editor.getValue() + '\n');
          this.editor.setCursor({ line: this.editor.lineCount(), ch: 0 });
        },
        'Cmd-S': () => {
          if (this.props.onSave) {
            this.props.onSave();
          }
        },
        'Ctrl-S': () => {
          if (this.props.onSave) {
            this.props.onSave();
          }
        },
        'Cmd-F': () => {},
        'Ctrl-F': () => {},
        // Tabbing disabled to make tabindex work
        Tab: false,
        'Shift-Tab': false
      }
    });
    
    // Setup AutoComplete Helper
    const autoCompleteOptions = {
      showHintsFor: ['variables'],
      anywordAutocompleteHints: this.props.autocomplete
    };

    const getVariables = () => getAllVariables(this.props.collection, this.props.item);

    this.brunoAutoCompleteCleanup = setupAutoComplete(
      this.editor,
      getVariables,
      autoCompleteOptions
    );
    
    this.editor.setValue(String(this.props.value) || '');
    this.editor.on('change', this._onEdit);
    this.addOverlay(variables);
  }

  _onEdit = () => {
    if (!this.ignoreChangeEvent && this.editor) {
      this.cachedValue = this.editor.getValue();
      if (this.props.onChange) {
        this.props.onChange(this.cachedValue);
      }
    }
  };

  componentDidUpdate(prevProps) {
    // Ensure the changes caused by this update are not interpreted as
    // user-input changes which could otherwise result in an infinite
    // event loop.
    this.ignoreChangeEvent = true;

    let variables = getAllVariables(this.props.collection, this.props.item);
    if (!isEqual(variables, this.variables)) {
      this.editor.options.brunoVarInfo.variables = variables;
      this.editor.options.brunoVarInfo.collectionUid = this.props.collection?.uid;
      this.editor.options.brunoVarInfo.store = this.props.store
      this.addOverlay(variables);
    }
    if (this.props.theme !== prevProps.theme && this.editor) {
      this.editor.setOption('theme', this.props.theme === 'dark' ? 'monokai' : 'default');
    }
    if (this.props.value !== prevProps.value && this.props.value !== this.cachedValue && this.editor) {
      this.cachedValue = String(this.props.value);
      this.editor.setValue(String(this.props.value) || '');
    }
    if (this.editorRef?.current) {
      this.editorRef.current.scrollTo(0, 10000);
    }
    this.ignoreChangeEvent = false;
  }

  componentWillUnmount() {
    if (this.brunoAutoCompleteCleanup) {
      this.brunoAutoCompleteCleanup();
    }
    this.editor.getWrapperElement().remove();
  }

  addOverlay = (variables) => {
    this.variables = variables;
    defineCodeMirrorBrunoVariablesMode(variables, 'text/plain', false, true);
    this.editor.setOption('mode', 'brunovariables');
  };

  render() {
    return <StyledWrapper ref={this.editorRef} className="single-line-editor"></StyledWrapper>;
  }
}
export default MultiLineEditor;
