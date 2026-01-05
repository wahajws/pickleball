import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../utils/apiClient';

// Custom hook for GET requests
export const useApiQuery = (key, endpoint, options = {}) => {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const response = await apiClient.get(endpoint);
      return response.data;
    },
    ...options,
  });
};

// Custom hook for POST requests
export const useApiMutation = (endpoint, options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post(endpoint, data);
      return response.data;
    },
    onSuccess: (data, variables, context) => {
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
};

// Custom hook for PUT/PATCH requests
export const useApiUpdate = (endpoint, options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const url = typeof endpoint === 'function' ? endpoint(id) : `${endpoint}/${id}`;
      const response = await apiClient.patch(url, data);
      return response.data;
    },
    onSuccess: (data, variables, context) => {
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
};

// Custom hook for DELETE requests
export const useApiDelete = (endpoint, options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const url = typeof endpoint === 'function' ? endpoint(id) : `${endpoint}/${id}`;
      const response = await apiClient.delete(url);
      return response.data;
    },
    onSuccess: (data, variables, context) => {
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
};


