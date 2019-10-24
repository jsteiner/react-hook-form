'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var React = require('react');

var isCheckBoxInput = (type) => type === 'checkbox';

const VALIDATION_MODE = {
    onBlur: 'onBlur',
    onChange: 'onChange',
    onSubmit: 'onSubmit',
};
const RADIO_INPUT = 'radio';
const REQUIRED_ATTRIBUTE = 'required';
const PATTERN_ATTRIBUTE = 'pattern';
const UNDEFINED = 'undefined';
const EVENTS = {
    BLUR: 'blur',
    CHANGE: 'change',
    INPUT: 'input',
};

function attachEventListeners({ field, validateAndStateUpdate, isRadio, isOnBlur, isReValidateOnBlur, }) {
    const { ref } = field;
    if (!ref.addEventListener)
        return;
    ref.addEventListener(isCheckBoxInput(ref.type) || isRadio ? EVENTS.CHANGE : EVENTS.INPUT, validateAndStateUpdate);
    if (isOnBlur || isReValidateOnBlur)
        ref.addEventListener(EVENTS.BLUR, validateAndStateUpdate);
}

var isUndefined = (val) => val === undefined;

var isNullOrUndefined = (value) => value === null || isUndefined(value);

var isArray = (value) => Array.isArray(value);

var isObject = (value) => !isNullOrUndefined(value) && !isArray(value) && typeof value === 'object';

const reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/;
const reIsPlainProp = /^\w*$/;
const rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
const reEscapeChar = /\\(\\)?/g;
const reIsUint = /^(?:0|[1-9]\d*)$/;
function isIndex(value) {
    return reIsUint.test(value) && value > -1;
}
function isKey(value) {
    if (isArray(value))
        return false;
    return reIsPlainProp.test(value) || !reIsDeepProp.test(value);
}
const stringToPath = (string) => {
    const result = [];
    string.replace(rePropName, (match, number, quote, string) => {
        result.push(quote ? string.replace(reEscapeChar, '$1') : number || match);
    });
    return result;
};
function set(object, path, value) {
    let index = -1;
    const tempPath = isKey(path) ? [path] : stringToPath(path);
    const length = tempPath.length;
    const lastIndex = length - 1;
    while (++index < length) {
        const key = tempPath[index];
        let newValue = value;
        if (index !== lastIndex) {
            const objValue = object[key];
            newValue =
                isObject(objValue) || isArray(objValue)
                    ? objValue
                    : isIndex(tempPath[index + 1])
                        ? []
                        : {};
        }
        object[key] = newValue;
        object = object[key];
    }
    return object;
}

var combineFieldValues = (data) => Object.entries(data).reduce((previous, [key, value]) => {
    if (!!key.match(/\[.+\]/gi) || key.indexOf('.') > 0) {
        set(previous, key, value);
        return previous;
    }
    return Object.assign(Object.assign({}, previous), { [key]: value });
}, {});

var removeAllEventListeners = (ref, validateWithStateUpdate) => {
    if (!ref.removeEventListener)
        return;
    ref.removeEventListener(EVENTS.INPUT, validateWithStateUpdate);
    ref.removeEventListener(EVENTS.CHANGE, validateWithStateUpdate);
    ref.removeEventListener(EVENTS.BLUR, validateWithStateUpdate);
};

var isRadioInput = (type) => type === RADIO_INPUT;

function isDetached(element) {
    if (!element)
        return true;
    if (!(element instanceof HTMLElement) ||
        element.nodeType === Node.DOCUMENT_NODE)
        return false;
    return isDetached(element.parentNode);
}

function findRemovedFieldAndRemoveListener(fields, validateWithStateUpdate = () => { }, field, forceDelete = false) {
    if (!field)
        return;
    const { ref, mutationWatcher, options } = field;
    if (!ref || !ref.type)
        return;
    const { name, type } = ref;
    if (isRadioInput(type) && options) {
        options.forEach(({ ref }, index) => {
            if ((options[index] && isDetached(ref)) || forceDelete) {
                removeAllEventListeners(options[index], validateWithStateUpdate);
                (options[index].mutationWatcher || { disconnect: () => { } }).disconnect();
                options.splice(index, 1);
            }
        });
        if (!options.length)
            delete fields[name];
    }
    else if (isDetached(ref) || forceDelete) {
        removeAllEventListeners(ref, validateWithStateUpdate);
        if (mutationWatcher)
            mutationWatcher.disconnect();
        delete fields[name];
    }
}

const defaultReturn = {
    isValid: false,
    value: '',
};
var getRadioValue = (options) => isArray(options)
    ? options.reduce((previous, { ref: { checked, value } }) => checked
        ? {
            isValid: true,
            value,
        }
        : previous, defaultReturn)
    : defaultReturn;

var getMultipleSelectValue = (options) => [...options]
    .filter(({ selected }) => selected)
    .map(({ value }) => value);

var isMultipleSelect = (type) => type === 'select-multiple';

function getFieldValue(fields, ref) {
    const { type, name, options, checked, value, files } = ref;
    if (type === 'file') {
        return files;
    }
    if (isRadioInput(type)) {
        const field = fields[name];
        return field ? getRadioValue(field.options).value : '';
    }
    if (isMultipleSelect(type))
        return getMultipleSelectValue(options);
    if (isCheckBoxInput(type)) {
        if (checked) {
            return ref.attributes && ref.attributes.value
                ? isUndefined(value) || value === ''
                    ? true
                    : value
                : true;
        }
        return false;
    }
    return value;
}

var getFieldsValues = (fields) => Object.values(fields).reduce((previous, { ref, ref: { name } }) => (Object.assign(Object.assign({}, previous), { [name]: getFieldValue(fields, ref) })), {});

var isEmptyObject = (value) => isObject(value) && Object.keys(value).length === 0;

var isSameError = (error, type, message) => isObject(error) && (error.type === type && error.message === message);

// TODO: improve the types in this file
function shouldUpdateWithError({ errors, name, error, validFields, fieldsWithValidation, }) {
    if ((validFields.has(name) && isEmptyObject(error)) ||
        (errors[name] && errors[name].isManual)) {
        return false;
    }
    if ((fieldsWithValidation.has(name) &&
        !validFields.has(name) &&
        isEmptyObject(error)) ||
        (isEmptyObject(errors) && !isEmptyObject(error)) ||
        (isEmptyObject(error) && errors[name]) ||
        !errors[name]) {
        return true;
    }
    return (errors[name] &&
        error[name] &&
        !isSameError(errors[name], error[name].type, error[name].message));
}

var isRegex = (value) => value instanceof RegExp;

var getValueAndMessage = (validationData) => ({
    value: isObject(validationData) && !isRegex(validationData)
        ? validationData.value
        : validationData,
    message: isObject(validationData) && !isRegex(validationData)
        ? validationData.message
        : '',
});

var isString = (value) => typeof value === 'string';

var displayNativeError = (nativeValidation, ref, message) => {
    if (nativeValidation && isString(message))
        ref.setCustomValidity(message);
};

var isFunction = (value) => typeof value === 'function';

var isBoolean = (value) => typeof value === 'boolean';

function getValidateFunctionErrorObject(result, ref, nativeError, type = 'validate') {
    const isStringValue = isString(result);
    if (isStringValue || (isBoolean(result) && !result)) {
        const message = isStringValue ? result : '';
        const error = {
            type,
            message,
            ref,
        };
        nativeError(message);
        return error;
    }
    return;
}

var validateField = async ({ ref, ref: { type, value, name, checked }, options, required, maxLength, minLength, min, max, pattern, validate, }, fields, nativeValidation) => {
    const error = {};
    const isRadio = isRadioInput(type);
    const isCheckBox = isCheckBoxInput(type);
    const nativeError = displayNativeError.bind(null, nativeValidation, ref);
    const typedName = name;
    if (required &&
        ((isCheckBox && !checked) ||
            (!isCheckBox && !isRadio && value === '') ||
            (isRadio && !getRadioValue(fields[typedName].options).isValid) ||
            (type !== RADIO_INPUT && isNullOrUndefined(value)))) {
        error[typedName] = {
            type: REQUIRED_ATTRIBUTE,
            message: isString(required) ? required : '',
            ref: isRadio ? fields[typedName].options[0].ref : ref,
        };
        nativeError(required);
        return error;
    }
    if (!isNullOrUndefined(min) || !isNullOrUndefined(max)) {
        let exceedMax;
        let exceedMin;
        const { value: maxValue, message: maxMessage } = getValueAndMessage(max);
        const { value: minValue, message: minMessage } = getValueAndMessage(min);
        if (type === 'number') {
            const valueNumber = parseFloat(value);
            if (!isNullOrUndefined(maxValue))
                exceedMax = valueNumber > maxValue;
            if (!isNullOrUndefined(minValue))
                exceedMin = valueNumber < minValue;
        }
        else {
            if (isString(maxValue))
                exceedMax = new Date(value) > new Date(maxValue);
            if (isString(minValue))
                exceedMin = new Date(value) < new Date(minValue);
        }
        if (exceedMax || exceedMin) {
            const message = exceedMax ? maxMessage : minMessage;
            error[typedName] = {
                type: exceedMax ? 'max' : 'min',
                message,
                ref,
            };
            nativeError(message);
            return error;
        }
    }
    if ((maxLength || minLength) && isString(value)) {
        const { value: maxLengthValue, message: maxLengthMessage, } = getValueAndMessage(maxLength);
        const { value: minLengthValue, message: minLengthMessage, } = getValueAndMessage(minLength);
        const inputLength = value.toString().length;
        const exceedMax = maxLength && inputLength > maxLengthValue;
        const exceedMin = minLength && inputLength < minLengthValue;
        if (exceedMax || exceedMin) {
            const message = exceedMax ? maxLengthMessage : minLengthMessage;
            error[typedName] = {
                type: exceedMax ? 'maxLength' : 'minLength',
                message,
                ref,
            };
            nativeError(message);
            return error;
        }
    }
    if (pattern) {
        const { value: patternValue, message: patternMessage } = getValueAndMessage(pattern);
        if (isRegex(patternValue) && !patternValue.test(value)) {
            error[typedName] = {
                type: PATTERN_ATTRIBUTE,
                message: patternMessage,
                ref,
            };
            nativeError(patternMessage);
            return error;
        }
    }
    if (validate) {
        const fieldValue = getFieldValue(fields, ref);
        const validateRef = isRadio && options ? options[0].ref : ref;
        if (isFunction(validate)) {
            const result = await validate(fieldValue);
            const errorObject = getValidateFunctionErrorObject(result, validateRef, nativeError);
            if (errorObject) {
                error[typedName] = errorObject;
                return error;
            }
        }
        else if (isObject(validate)) {
            const validationResult = await new Promise((resolve) => {
                const values = Object.entries(validate);
                values.reduce(async (previous, [key, validate], index) => {
                    const lastChild = values.length - 1 === index;
                    if (isFunction(validate)) {
                        const result = await validate(fieldValue);
                        const errorObject = getValidateFunctionErrorObject(result, validateRef, nativeError, key);
                        if (errorObject) {
                            return lastChild ? resolve(errorObject) : errorObject;
                        }
                    }
                    return lastChild ? resolve(previous) : previous;
                }, {});
            });
            if (!isEmptyObject(validationResult)) {
                error[typedName] = Object.assign({ ref: validateRef }, validationResult);
                return error;
            }
        }
    }
    if (nativeValidation)
        ref.setCustomValidity('');
    return error;
};

// TODO: Fix these types
const parseErrorSchema = (error) => error.inner.length
    ? error.inner.reduce((previous, { path, message, type }) => (Object.assign(Object.assign({}, previous), { [path]: { message, ref: {}, type } })), {})
    : {
        [error.path]: { message: error.message, ref: {}, type: error.type },
    };
async function validateWithSchema(validationSchema, validationSchemaOption, data) {
    try {
        return {
            result: await validationSchema.validate(data, validationSchemaOption),
            fieldErrors: {},
        };
    }
    catch (e) {
        return {
            result: {},
            fieldErrors: parseErrorSchema(e),
        };
    }
}

function attachNativeValidation(ref, rules) {
    Object.entries(rules).forEach(([key, value]) => {
        if (key === PATTERN_ATTRIBUTE && isRegex(value)) {
            ref[key] = value.source;
        }
        else {
            ref[key] = key === REQUIRED_ATTRIBUTE ? true : value;
        }
    });
}

var get = (obj, path, defaultValue) => {
    const result = String.prototype.split
        .call(path, /[,[\].]+?/)
        .filter(Boolean)
        .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj);
    return result === undefined || result === obj ? defaultValue : result;
};

var getDefaultValue = (defaultValues, name, defaultValue) => isUndefined(defaultValues[name])
    ? get(defaultValues, name, defaultValue)
    : defaultValues[name];

function flatArray(list) {
    return list.reduce((a, b) => a.concat(isArray(b) ? flatArray(b) : b), []);
}

const getPath = (path, values) => isArray(values)
    ? values.map((item, index) => {
        const pathWithIndex = `${path}[${index}]`;
        if (isArray(item)) {
            return getPath(pathWithIndex, item);
        }
        else if (isObject(item)) {
            return Object.entries(item).map(([key, objectValue]) => isString(objectValue)
                ? `${pathWithIndex}.${key}`
                : getPath(`${pathWithIndex}.${key}`, objectValue));
        }
        return pathWithIndex;
    })
    : Object.entries(values).map(([key, objectValue]) => isString(objectValue) ? `${path}.${key}` : getPath(path, objectValue));
var getPath$1 = (parentPath, value) => flatArray(getPath(parentPath, value));

var assignWatchFields = (fieldValues, fieldName, watchFields) => {
    if (isNullOrUndefined(fieldValues) || isEmptyObject(fieldValues))
        return undefined;
    if (!isUndefined(fieldValues[fieldName])) {
        watchFields[fieldName] = true;
        return fieldValues[fieldName];
    }
    const values = get(combineFieldValues(fieldValues), fieldName);
    if (!isUndefined(values)) {
        const result = getPath$1(fieldName, values);
        if (isArray(result)) {
            result.forEach(name => {
                watchFields[name] = true;
            });
        }
    }
    return values;
};

var omitValidFields = (errorFields, validFieldNames) => Object.entries(errorFields).reduce((previous, [name, error]) => validFieldNames.some((validFieldName) => validFieldName === name)
    ? previous
    : Object.assign(Object.assign({}, previous), { [name]: error }), {});

function onDomRemove(element, onDetachCallback) {
    const observer = new MutationObserver(() => {
        if (isDetached(element)) {
            observer.disconnect();
            onDetachCallback();
        }
    });
    observer.observe(window.document, {
        childList: true,
        subtree: true,
    });
    return observer;
}

var modeChecker = (mode) => ({
    isOnSubmit: !mode || mode === VALIDATION_MODE.onSubmit,
    isOnBlur: mode === VALIDATION_MODE.onBlur,
    isOnChange: mode === VALIDATION_MODE.onChange,
});

var pickErrors = (errors, pickList) => Object.entries(errors).reduce((previous, [key, error]) => (Object.assign(Object.assign({}, previous), (pickList.includes(key) ? { [key]: error } : null))), {});

function useForm({ mode = VALIDATION_MODE.onSubmit, reValidateMode = VALIDATION_MODE.onChange, validationSchema, defaultValues = {}, validationFields, nativeValidation, submitFocusError = true, validationSchemaOption = { abortEarly: false }, } = {}) {
    const fieldsRef = React.useRef({});
    const errorsRef = React.useRef({});
    const schemaErrorsRef = React.useRef({});
    const touchedFieldsRef = React.useRef(new Set());
    const watchFieldsRef = React.useRef({});
    const dirtyFieldsRef = React.useRef(new Set());
    const fieldsWithValidationRef = React.useRef(new Set());
    const validFieldsRef = React.useRef(new Set());
    const defaultValuesRef = React.useRef({});
    const isUnMount = React.useRef(false);
    const isWatchAllRef = React.useRef(false);
    const isSubmittedRef = React.useRef(false);
    const isDirtyRef = React.useRef(false);
    const submitCountRef = React.useRef(0);
    const isSubmittingRef = React.useRef(false);
    const isSchemaValidateTriggeredRef = React.useRef(false);
    const validationFieldsRef = React.useRef(validationFields);
    const validateAndUpdateStateRef = React.useRef();
    const [, render] = React.useState();
    const { isOnBlur, isOnSubmit } = React.useRef(modeChecker(mode)).current;
    const { isOnBlur: isReValidateOnBlur, isOnSubmit: isReValidateOnSubmit, } = React.useRef(modeChecker(reValidateMode)).current;
    const validationSchemaOptionRef = React.useRef(validationSchemaOption);
    validationFieldsRef.current = validationFields;
    const combineErrorsRef = (data) => (Object.assign(Object.assign({}, errorsRef.current), data));
    const renderBaseOnError = React.useCallback((name, error, shouldRender = true) => {
        if (isEmptyObject(error)) {
            delete errorsRef.current[name];
            if (fieldsWithValidationRef.current.has(name) || validationSchema)
                validFieldsRef.current.add(name);
        }
        else {
            validFieldsRef.current.delete(name);
        }
        if (shouldRender)
            render({});
    }, [validationSchema]);
    const setFieldValue = (name, rawValue) => {
        const field = fieldsRef.current[name];
        if (!field)
            return false;
        const ref = field.ref;
        const { type } = ref;
        const options = field.options;
        const value = typeof document !== UNDEFINED &&
            typeof window !== UNDEFINED &&
            !isUndefined(window.HTMLElement) &&
            ref instanceof window.HTMLElement &&
            isNullOrUndefined(rawValue)
            ? ''
            : rawValue;
        if (isRadioInput(type) && options) {
            options.forEach(({ ref: radioRef }) => (radioRef.checked = radioRef.value === value));
        }
        else if (isMultipleSelect(type)) {
            [...ref.options].forEach(selectRef => (selectRef.selected = value.includes(selectRef.value)));
        }
        else {
            ref[isCheckBoxInput(type) ? 'checked' : 'value'] = value;
        }
        return type;
    };
    const setDirty = (name) => {
        if (!fieldsRef.current[name])
            return false;
        const isDirty = defaultValuesRef.current[name] !==
            getFieldValue(fieldsRef.current, fieldsRef.current[name].ref);
        const isDirtyChanged = dirtyFieldsRef.current.has(name) !== isDirty;
        if (isDirty) {
            dirtyFieldsRef.current.add(name);
        }
        else {
            dirtyFieldsRef.current.delete(name);
        }
        isDirtyRef.current = !!dirtyFieldsRef.current.size;
        return isDirtyChanged;
    };
    const setValueInternal = React.useCallback((name, value) => {
        const shouldRender = setFieldValue(name, value);
        if (setDirty(name) ||
            shouldRender ||
            !touchedFieldsRef.current.has(name)) {
            touchedFieldsRef.current.add(name);
            render({});
        }
    }, []);
    const executeValidation = React.useCallback(async ({ name, value, }, shouldRender = true) => {
        const field = fieldsRef.current[name];
        if (!field)
            return false;
        if (!isUndefined(value))
            setValueInternal(name, value);
        const error = await validateField(field, fieldsRef.current);
        errorsRef.current = combineErrorsRef(error);
        renderBaseOnError(name, error, shouldRender);
        return isEmptyObject(error);
    }, [renderBaseOnError, setValueInternal]);
    const validateWithSchemaCurry = React.useCallback(validateWithSchema.bind(null, validationSchema, validationSchemaOptionRef.current), [validationSchema]);
    const executeSchemaValidation = React.useCallback(async (payload) => {
        const { fieldErrors } = await validateWithSchemaCurry(combineFieldValues(getFieldsValues(fieldsRef.current)));
        const names = isArray(payload)
            ? payload.map(({ name }) => name)
            : [payload.name];
        const validFieldNames = names.filter(name => !fieldErrors[name]);
        schemaErrorsRef.current = fieldErrors;
        isSchemaValidateTriggeredRef.current = true;
        errorsRef.current = omitValidFields(combineErrorsRef(Object.entries(fieldErrors)
            .filter(([key]) => names.includes(key))
            .reduce((previous, [name, error]) => (Object.assign(Object.assign({}, previous), { [name]: error })), {})), validFieldNames);
        render({});
        return isEmptyObject(errorsRef.current);
    }, [validateWithSchemaCurry]);
    const triggerValidation = React.useCallback(async (payload, shouldRender) => {
        const fields = payload || Object.keys(fieldsRef.current).map(name => ({ name }));
        if (validationSchema)
            return executeSchemaValidation(fields);
        if (isArray(fields)) {
            const result = await Promise.all(fields.map(async (data) => await executeValidation(data, false)));
            render({});
            return result.every(Boolean);
        }
        return await executeValidation(fields, shouldRender);
    }, [executeSchemaValidation, executeValidation, validationSchema]);
    const setValue = React.useCallback((name, value, shouldValidate = false) => {
        setValueInternal(name, value);
        const shouldRender = isWatchAllRef.current || watchFieldsRef.current[name];
        if (shouldValidate) {
            return triggerValidation({ name }, shouldRender);
        }
        if (shouldRender)
            render({});
        return;
    }, [setValueInternal, triggerValidation]);
    validateAndUpdateStateRef.current = validateAndUpdateStateRef.current
        ? validateAndUpdateStateRef.current
        : async (event) => {
            const { type, target } = event;
            const name = target ? target.name : '';
            if (isArray(validationFieldsRef.current) &&
                !validationFieldsRef.current.includes(name))
                return;
            const fields = fieldsRef.current;
            const errors = errorsRef.current;
            const ref = fields[name];
            let error;
            if (!ref)
                return;
            const isBlurEvent = type === EVENTS.BLUR;
            const shouldSkipValidation = (isOnSubmit && !isSubmittedRef.current) ||
                (isOnBlur && !isBlurEvent && !errors[name]) ||
                (isReValidateOnBlur && !isBlurEvent && errors[name]) ||
                (isReValidateOnSubmit && errors[name]);
            const shouldUpdateDirty = setDirty(name);
            let shouldUpdateState = isWatchAllRef.current ||
                watchFieldsRef.current[name] ||
                shouldUpdateDirty;
            if (!touchedFieldsRef.current.has(name)) {
                touchedFieldsRef.current.add(name);
                shouldUpdateState = true;
            }
            if (shouldSkipValidation)
                return shouldUpdateState ? render({}) : undefined;
            if (validationSchema) {
                const { fieldErrors } = await validateWithSchemaCurry(combineFieldValues(getFieldsValues(fields)));
                schemaErrorsRef.current = fieldErrors;
                isSchemaValidateTriggeredRef.current = true;
                error = fieldErrors[name]
                    ? { [name]: fieldErrors[name] }
                    : {};
            }
            else {
                error = await validateField(ref, fields, nativeValidation);
            }
            const shouldUpdate = shouldUpdateWithError({
                errors,
                error,
                name,
                validFields: validFieldsRef.current,
                fieldsWithValidation: fieldsWithValidationRef.current,
            });
            if (shouldUpdate) {
                errorsRef.current = combineErrorsRef(error);
                renderBaseOnError(name, error);
                return;
            }
            if (shouldUpdateState)
                render({});
        };
    const resetFieldRef = (name) => {
        delete watchFieldsRef.current[name];
        delete errorsRef.current[name];
        delete fieldsRef.current[name];
        delete defaultValuesRef.current[name];
        [
            touchedFieldsRef,
            dirtyFieldsRef,
            fieldsWithValidationRef,
            validFieldsRef,
        ].forEach(data => data.current.delete(name));
    };
    const removeEventListenerAndRef = React.useCallback((field, forceDelete) => {
        if (!field)
            return;
        findRemovedFieldAndRemoveListener(fieldsRef.current, validateAndUpdateStateRef.current, field, forceDelete);
        resetFieldRef(field.ref.name);
    }, []);
    function clearError(name) {
        if (isUndefined(name)) {
            errorsRef.current = {};
        }
        else {
            (isArray(name) ? name : [name]).forEach(fieldName => delete errorsRef.current[fieldName]);
        }
        render({});
    }
    const setError = (name, type, message, ref) => {
        const errors = errorsRef.current;
        if (!isSameError(errors[name], type, message)) {
            errors[name] = {
                type,
                message,
                ref,
                isManual: true,
            };
            render({});
        }
    };
    function watch(fieldNames, defaultValue) {
        const fieldValues = getFieldsValues(fieldsRef.current);
        const watchFields = watchFieldsRef.current;
        if (isString(fieldNames)) {
            const value = assignWatchFields(fieldValues, fieldNames, watchFields);
            return isUndefined(value)
                ? isUndefined(defaultValue)
                    ? getDefaultValue(defaultValues, fieldNames)
                    : defaultValue
                : value;
        }
        if (isArray(fieldNames)) {
            return fieldNames.reduce((previous, name) => {
                let value = getDefaultValue(defaultValues, name);
                if (isEmptyObject(fieldsRef.current) && isObject(defaultValue)) {
                    value = defaultValue[name];
                }
                else {
                    const tempValue = assignWatchFields(fieldValues, name, watchFields);
                    if (!isUndefined(tempValue))
                        value = tempValue;
                }
                return Object.assign(Object.assign({}, previous), { [name]: value });
            }, {});
        }
        isWatchAllRef.current = true;
        return ((!isEmptyObject(fieldValues) && fieldValues) ||
            defaultValue ||
            defaultValues);
    }
    function registerIntoFieldsRef(ref, validateOptions = {}) {
        if (!ref.name)
            return console.warn('Missing name on ref', ref);
        const { name, type, value } = ref;
        const typedName = name;
        const fieldAttributes = Object.assign({ ref }, validateOptions);
        const fields = fieldsRef.current;
        const isRadio = isRadioInput(type);
        let currentField = (fields[typedName] || undefined);
        const isRegistered = isRadio
            ? currentField &&
                isArray(currentField.options) &&
                currentField.options.find(({ ref }) => value === ref.value)
            : currentField;
        if (isRegistered)
            return;
        if (!type) {
            currentField = fieldAttributes;
        }
        else {
            const mutationWatcher = onDomRemove(ref, () => removeEventListenerAndRef(fieldAttributes));
            if (isRadio) {
                currentField = Object.assign({ options: [
                        ...(currentField && currentField.options
                            ? currentField.options
                            : []),
                        {
                            ref,
                            mutationWatcher,
                        },
                    ], ref: { type: RADIO_INPUT, name } }, validateOptions);
            }
            else {
                currentField = Object.assign(Object.assign({}, fieldAttributes), { mutationWatcher });
            }
        }
        fields[typedName] = currentField;
        if (!isEmptyObject(defaultValues)) {
            const defaultValue = getDefaultValue(defaultValues, name);
            if (!isUndefined(defaultValue))
                setFieldValue(name, defaultValue);
        }
        if (validateOptions && !isEmptyObject(validateOptions)) {
            fieldsWithValidationRef.current.add(name);
            if (!isOnSubmit) {
                if (validationSchema) {
                    isSchemaValidateTriggeredRef.current = true;
                    validateWithSchemaCurry(combineFieldValues(getFieldsValues(fields))).then(({ fieldErrors }) => {
                        schemaErrorsRef.current = fieldErrors;
                        if (isEmptyObject(schemaErrorsRef.current))
                            render({});
                    });
                }
                else {
                    validateField(currentField, fields).then(error => {
                        if (isEmptyObject(error))
                            validFieldsRef.current.add(name);
                        if (validFieldsRef.current.size ===
                            fieldsWithValidationRef.current.size)
                            render({});
                    });
                }
            }
        }
        if (!defaultValuesRef.current[typedName])
            defaultValuesRef.current[typedName] = getFieldValue(fields, currentField.ref);
        if (!type)
            return;
        const fieldToRegister = isRadio && currentField.options
            ? currentField.options[currentField.options.length - 1]
            : currentField;
        if (isOnSubmit && isReValidateOnSubmit)
            return;
        if (nativeValidation && validateOptions) {
            attachNativeValidation(ref, validateOptions);
        }
        else {
            attachEventListeners({
                field: fieldToRegister,
                isRadio,
                validateAndStateUpdate: validateAndUpdateStateRef.current,
                isOnBlur,
                isReValidateOnBlur,
            });
        }
    }
    function register(refOrValidateRule, validationOptions) {
        if (typeof window === UNDEFINED || !refOrValidateRule)
            return;
        if (isObject(refOrValidateRule) &&
            (validationOptions || 'name' in refOrValidateRule)) {
            registerIntoFieldsRef(refOrValidateRule, validationOptions);
            return;
        }
        return (ref) => ref && registerIntoFieldsRef(ref, refOrValidateRule);
    }
    function unregister(names) {
        if (isEmptyObject(fieldsRef.current))
            return;
        (isArray(names) ? names : [names]).forEach(fieldName => removeEventListenerAndRef(fieldsRef.current[fieldName], true));
    }
    const handleSubmit = (callback) => async (e) => {
        if (e) {
            e.preventDefault();
            e.persist();
        }
        let fieldErrors;
        let fieldValues;
        const fields = fieldsRef.current;
        const fieldsToValidate = validationFields
            ? validationFields.map(name => fieldsRef.current[name])
            : Object.values(fields);
        isSubmittingRef.current = true;
        render({});
        if (validationSchema) {
            fieldValues = getFieldsValues(fields);
            const output = await validateWithSchemaCurry(combineFieldValues(fieldValues));
            schemaErrorsRef.current = output.fieldErrors;
            fieldErrors = output.fieldErrors;
            fieldValues = output.result;
        }
        else {
            const { errors, values, } = await fieldsToValidate.reduce(async (previous, field) => {
                if (!field)
                    return previous;
                const resolvedPrevious = await previous;
                const { ref, ref: { name }, } = field;
                if (!fields[name])
                    return Promise.resolve(resolvedPrevious);
                const fieldError = await validateField(field, fields, nativeValidation);
                if (fieldError[name]) {
                    resolvedPrevious.errors = Object.assign(Object.assign({}, resolvedPrevious.errors), fieldError);
                    validFieldsRef.current.delete(name);
                    return Promise.resolve(resolvedPrevious);
                }
                if (fieldsWithValidationRef.current.has(name))
                    validFieldsRef.current.add(name);
                resolvedPrevious.values[name] = getFieldValue(fields, ref);
                return Promise.resolve(resolvedPrevious);
            }, Promise.resolve({
                errors: {},
                values: {},
            }));
            fieldErrors = errors;
            fieldValues = values;
        }
        if (isEmptyObject(fieldErrors)) {
            errorsRef.current = {};
            await callback(combineFieldValues(fieldValues), e);
        }
        else {
            if (submitFocusError) {
                Object.keys(fieldErrors).reduce((previous, current) => {
                    const field = fields[current];
                    if (field && field.ref.focus && previous) {
                        field.ref.focus();
                        return false;
                    }
                    return previous;
                }, true);
            }
            errorsRef.current = fieldErrors;
        }
        if (isUnMount.current)
            return;
        isSubmittedRef.current = true;
        isSubmittingRef.current = false;
        submitCountRef.current = submitCountRef.current + 1;
        render({});
    };
    const resetRefs = () => {
        errorsRef.current = {};
        schemaErrorsRef.current = {};
        touchedFieldsRef.current = new Set();
        watchFieldsRef.current = {};
        dirtyFieldsRef.current = new Set();
        fieldsWithValidationRef.current = new Set();
        validFieldsRef.current = new Set();
        defaultValuesRef.current = {};
        isWatchAllRef.current = false;
        isSubmittedRef.current = false;
        isDirtyRef.current = false;
        isSchemaValidateTriggeredRef.current = false;
    };
    const reset = React.useCallback((values) => {
        const fieldsKeyValue = Object.entries(fieldsRef.current);
        for (let [, value] of fieldsKeyValue) {
            if (value && value.ref && value.ref.closest) {
                try {
                    value.ref.closest('form').reset();
                    break;
                }
                catch (_a) { }
            }
        }
        resetRefs();
        if (values) {
            fieldsKeyValue.forEach(([key]) => setFieldValue(key, getDefaultValue(values, key)));
            defaultValuesRef.current = Object.assign({}, values);
        }
        submitCountRef.current = 0;
        render({});
    }, []);
    const getValues = (payload) => {
        const fieldValues = getFieldsValues(fieldsRef.current);
        const outputValues = isEmptyObject(fieldValues) ? defaultValues : fieldValues;
        return payload && payload.nest ? combineFieldValues(outputValues) : outputValues;
    };
    React.useEffect(() => () => {
        isUnMount.current = true;
        fieldsRef.current &&
            Object.values(fieldsRef.current).forEach((field) => removeEventListenerAndRef(field, true));
    }, [removeEventListenerAndRef]);
    return {
        register: React.useCallback(register, [registerIntoFieldsRef]),
        unregister: React.useCallback(unregister, [
            unregister,
            removeEventListenerAndRef,
        ]),
        handleSubmit,
        watch,
        reset,
        clearError,
        setError,
        setValue,
        triggerValidation,
        getValues,
        errors: validationFields
            ? pickErrors(errorsRef.current, validationFields)
            : errorsRef.current,
        formState: Object.assign({ dirty: isDirtyRef.current, isSubmitted: isSubmittedRef.current, submitCount: submitCountRef.current, touched: [...touchedFieldsRef.current], isSubmitting: isSubmittingRef.current }, (isOnSubmit
            ? {
                isValid: isEmptyObject(errorsRef.current),
            }
            : {
                isValid: validationSchema
                    ? isSchemaValidateTriggeredRef.current &&
                        isEmptyObject(schemaErrorsRef.current)
                    : fieldsWithValidationRef.current.size
                        ? !isEmptyObject(fieldsRef.current) &&
                            validFieldsRef.current.size >=
                                fieldsWithValidationRef.current.size
                        : !isEmptyObject(fieldsRef.current),
            })),
    };
}

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

const FormGlobalContext = React.createContext(null);
function useFormContext() {
    return React.useContext(FormGlobalContext);
}
function FormContext(props) {
    const { children, formState, errors } = props, restMethods = __rest(props, ["children", "formState", "errors"]);
    const restRef = React.useRef(restMethods);
    return (React.createElement(FormGlobalContext.Provider, { value: Object.assign(Object.assign({}, restRef.current), { formState, errors }) }, children));
}

exports.FormContext = FormContext;
exports.default = useForm;
exports.useFormContext = useFormContext;