import { Field } from '../types';
export default function attachEventListeners({ field, validateAndStateUpdate, isRadio, }: {
    field: Field;
    isRadio: boolean;
    validateAndStateUpdate?: Function;
}): void;
