const _ = require('lodash');
const assert = require('assert').strict;

const lastFireUtils = {
  //  Get last Fires using a handler function.
  // This is also to avoid loading all rows in memory.
  async getLastFires(db, {hookGroupId, hookId}, handler) {
    assert(handler instanceof Function, 'handler must be a function');
    const pageSize = 1000;
    let pageOffset = 0;

    while (true) {
      const rows = await db.fns.get_last_fires(hookGroupId, hookId, pageSize, pageOffset);
      const entries = rows.map(row => ({
        hookGroupId: row.hook_group_id,
        hookId: row.hook_id,
        firedBy: row.fired_by,
        taskId: row.task_id,
        taskCreateTime: row.task_create_time,
        result: row.result,
        error: row.error,
      }));
      await Promise.all(entries.map((item) => handler.call(item, item)));
      pageOffset = pageOffset + pageSize;

      if (!rows.length) {
        break;
      }
    }
  },
  definition(lastFire) {
    return {
      hookGroupId: lastFire.hookGroupId,
      hookId: lastFire.hookId,
      firedBy: lastFire.firedBy,
      taskId: lastFire.taskId,
      taskCreateTime: lastFire.taskCreateTime,
      result: lastFire.result,
      error: lastFire.error,
    };
  },
};

exports.lastFireUtils = lastFireUtils;

const queueUtils = {
  // Create a single instance from a DB row
  fromDb(row) {
    return {
      hookGroupId: row.hook_group_id,
      hookId: row.hook_id,
      queueName: row.queue_name,
      bindings: row.bindings,
    };
  },
};

exports.queueUtils = queueUtils;

const hookUtils = {
  // Create a single instance, or undefined, from a set of rows containing zero
  // or one elements
  fromDbRows(rows) {
    if (rows.length === 1) {
      return exports.hookUtils.fromDb(rows[0]);
    }
  },
  // Create a single instance from a DB row
  fromDb(row) {
    return {
      hookGroupId: row.hook_group_id,
      hookId: row.hook_id,
      metadata: row.metadata,
      task: row.task,
      bindings: row.bindings,
      schedule: row.schedule,
      triggerToken: row.encrypted_trigger_token,
      nextTaskId: row.encrypted_next_task_id,
      nextScheduledDate: row.next_scheduled_date,
      triggerSchema: row.trigger_schema,
    };
  },
  //  Get hooks using a handler function.
  // This is also to avoid loading all rows in memory.
  async getHooks(db, {hookGroupId}, handler) {
    assert(handler instanceof Function, 'handler must be a function');
    const pageSize = 1000;
    let pageOffset = 0;

    while (true) {
      const rows = await db.fns.get_hooks(hookGroupId, pageSize, pageOffset);
      const entries = rows.map(exports.hookUtils.fromDb);
      await Promise.all(entries.map((item) => handler.call(item, item)));
      pageOffset = pageOffset + pageSize;

      if (!rows.length) {
        break;
      }
    }
  },
  definition(hook) {
    return {
      hookId: hook.hookId,
      hookGroupId: hook.hookGroupId,
      bindings: hook.bindings,
      metadata: _.cloneDeep(hook.metadata),
      task: _.cloneDeep(hook.task),
      schedule: _.cloneDeep(hook.schedule),
      triggerSchema: hook.triggerSchema,
    };
  },
};

exports.hookUtils = hookUtils;
