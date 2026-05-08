import { useReducer, useCallback } from 'react';
import { PivotZone, DraggableField, AggregationType, DateGrouping, FilterOperator } from '../types';

export type PivotState = {
  zones: Record<string, PivotZone>;
  isInitialized: boolean;
  showGrandTotals: boolean;
  showSubtotals: boolean;
};

type PivotAction =
  | { type: 'SET_ZONES'; payload: Record<string, PivotZone> }
  | { type: 'INITIALIZE'; payload: DraggableField[] }
  | { type: 'UPDATE_FIELD_AGG'; payload: { fieldId: string; agg: AggregationType } }
  | { type: 'UPDATE_FIELD_DATE_GROUPING'; payload: { zoneId: string; fieldId: string; grouping: DateGrouping } }
  | { type: 'UPDATE_FIELD_FILTER'; payload: { fieldId: string; operator: FilterOperator; value: string } }
  | { type: 'TOGGLE_GRAND_TOTALS' }
  | { type: 'TOGGLE_SUBTOTALS' }
  | { type: 'RESET_INITIAL'; payload: DraggableField[] }
  | { type: 'RESET_STATE' };

const initialState: PivotState = {
  zones: {
    available: { id: 'available', fields: [] },
    rows: { id: 'rows', fields: [] },
    columns: { id: 'columns', fields: [] },
    values: { id: 'values', fields: [] },
    filters: { id: 'filters', fields: [] },
  },
  isInitialized: false,
  showGrandTotals: true,
  showSubtotals: true,
};

function pivotReducer(state: PivotState, action: PivotAction): PivotState {
  switch (action.type) {
    case 'SET_ZONES':
      return { ...state, zones: action.payload };
    
    case 'INITIALIZE':
      return {
        ...state,
        isInitialized: true,
        zones: {
          available: { id: 'available', fields: [...action.payload] },
          rows: { id: 'rows', fields: [] },
          columns: { id: 'columns', fields: [] },
          values: { id: 'values', fields: [] },
          filters: { id: 'filters', fields: [] },
        }
      };

    case 'UPDATE_FIELD_AGG': {
      const { fieldId, agg } = action.payload;
      const newValues = state.zones.values.fields.map(f => 
        f.id === fieldId ? { ...f, aggType: agg } : f
      );
      return {
        ...state,
        zones: {
          ...state.zones,
          values: { ...state.zones.values, fields: newValues }
        }
      };
    }

    case 'UPDATE_FIELD_DATE_GROUPING': {
      const { zoneId, fieldId, grouping } = action.payload;
      const zoneKey = zoneId as keyof typeof state.zones;
      const newFields = state.zones[zoneKey].fields.map(f => 
        f.id === fieldId ? { ...f, dateGrouping: grouping } : f
      );
      return {
        ...state,
        zones: {
          ...state.zones,
          [zoneKey]: { ...state.zones[zoneKey], fields: newFields }
        }
      };
    }

    case 'UPDATE_FIELD_FILTER': {
      const { fieldId, operator, value } = action.payload;
      const newFields = state.zones.filters.fields.map(f => 
        f.id === fieldId ? { ...f, filterOperator: operator, filterValue: value } : f
      );
      return {
        ...state,
        zones: {
          ...state.zones,
          filters: { ...state.zones.filters, fields: newFields }
        }
      };
    }

    case 'TOGGLE_GRAND_TOTALS':
      return { ...state, showGrandTotals: !state.showGrandTotals };
    
    case 'TOGGLE_SUBTOTALS':
      return { ...state, showSubtotals: !state.showSubtotals };

    case 'RESET_INITIAL':
      return {
        ...initialState,
        isInitialized: true,
        zones: {
          ...initialState.zones,
          available: { id: 'available', fields: [...action.payload] },
        }
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

export function usePivotState() {
  const [state, dispatch] = useReducer(pivotReducer, initialState);

  const setZones = useCallback((zones: Record<string, PivotZone>) => {
    dispatch({ type: 'SET_ZONES', payload: zones });
  }, []);

  const initializeZones = useCallback((fields: DraggableField[]) => {
    dispatch({ type: 'INITIALIZE', payload: fields });
  }, []);

  const resetInitialZones = useCallback((fields: DraggableField[]) => {
    dispatch({ type: 'RESET_INITIAL', payload: fields });
  }, []);

  const updateFieldAgg = useCallback((fieldId: string, agg: AggregationType) => {
    dispatch({ type: 'UPDATE_FIELD_AGG', payload: { fieldId, agg } });
  }, []);

  const updateFieldDateGrouping = useCallback((zoneId: string, fieldId: string, grouping: DateGrouping) => {
    dispatch({ type: 'UPDATE_FIELD_DATE_GROUPING', payload: { zoneId, fieldId, grouping } });
  }, []);

  const updateFieldFilter = useCallback((fieldId: string, operator: FilterOperator, value: string) => {
    dispatch({ type: 'UPDATE_FIELD_FILTER', payload: { fieldId, operator, value } });
  }, []);

  const toggleGrandTotals = useCallback(() => {
    dispatch({ type: 'TOGGLE_GRAND_TOTALS' });
  }, []);

  const toggleSubtotals = useCallback(() => {
    dispatch({ type: 'TOGGLE_SUBTOTALS' });
  }, []);

  const resetPivotState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  return {
    zones: state.zones,
    isInitialized: state.isInitialized,
    showGrandTotals: state.showGrandTotals,
    showSubtotals: state.showSubtotals,
    setZones,
    initializeZones,
    resetInitialZones,
    updateFieldAgg,
    updateFieldDateGrouping,
    updateFieldFilter,
    toggleGrandTotals,
    toggleSubtotals,
    resetPivotState,
  };
}
