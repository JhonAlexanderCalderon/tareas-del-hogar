import { completeTask, uncompleteTask } from '../firebase/firestore'

export function toggleTaskCompletion({ home, appUser, completedKeys, task, date }) {
  const key = `${task.id}_${date}`
  if (completedKeys.has(key)) {
    return uncompleteTask(home.id, task.id, date)
  }
  return completeTask({
    homeId: home.id,
    taskId: task.id,
    date,
    taskTitle: task.title,
    assigneeId: task.assigneeId,
    assigneeName: task.assigneeName,
    completedBy: appUser.uid,
    completedByName: appUser.name,
  })
}
