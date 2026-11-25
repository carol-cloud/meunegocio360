import { forwardRef } from 'react';
import Form from 'react-bootstrap/Form';
import { formatarDocumento, TIPOS_PESSOA } from '../lib/documentos.js';

// Campo de CPF/CNPJ com a máscara do tipo de pessoa (RNF-FE-28). O valor exibido tem máscara;
// quem envia à API remove os não dígitos (schema Zod do formulário).
const DocumentoInput = forwardRef(function DocumentoInput({ tipoPessoa, onChange, ...props }, ref) {
  const fisica = tipoPessoa === TIPOS_PESSOA.FISICA;
  return (
    <Form.Control
      ref={ref}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder={fisica ? '000.000.000-00' : '00.000.000/0000-00'}
      {...props}
      onChange={(evento) => onChange(formatarDocumento(evento.target.value, tipoPessoa))}
    />
  );
});

export default DocumentoInput;
