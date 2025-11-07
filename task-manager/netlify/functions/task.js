import { updateTask, removeTask } from '../../api/_lib/taskStore.js';

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

const extractTaskId = (event) => {
  if (event.pathParameters && event.pathParameters.id) {
    return event.pathParameters.id;
  }

  const parts = event.path ? event.path.split('/') : [];
  return parts[parts.length - 1] || '';
};

export const handler = async (event) => {
  const taskId = extractTaskId(event);
  if (!taskId) {
    return jsonResponse(400, { msg: 'task id required' });
  }

  if (event.httpMethod === 'PATCH') {
    try {
      const payload = event.body ? JSON.parse(event.body) : {};
      const { isDone } = payload;
      if (typeof isDone !== 'boolean') {
        return jsonResponse(400, { msg: 'please provide isDone boolean' });
      }
      await updateTask(taskId, isDone);
      return jsonResponse(200, { msg: 'task updated' });
    } catch (error) {
      return jsonResponse(500, { msg: 'something went wrong' });
    }
  }

  if (event.httpMethod === 'DELETE') {
    try {
      await removeTask(taskId);
      return jsonResponse(200, { msg: 'task removed' });
    } catch (error) {
      return jsonResponse(500, { msg: 'something went wrong' });
    }
  }

  return jsonResponse(405, { msg: 'method not allowed' });
};

