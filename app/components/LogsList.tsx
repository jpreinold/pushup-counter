import { useLogs } from "../context/LogContext";
import { useAchievements } from "../context/AchievementContext";

export default function LogsList() {
  const { logs, deleteLog } = useLogs();
  const { validateAchievements } = useAchievements();
  
  const handleDeleteLog = (id: string) => {
    deleteLog(id);
    validateAchievements(); // Call validation after deleting logs
  };
  
  return (
    <div>
      {logs.map(log => (
        <div key={log.id}>
          {/* Your log item content */}
          <button onClick={() => handleDeleteLog(log.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
} 