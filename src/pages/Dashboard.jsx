import { useAuth0 } from "@auth0/auth0-react";
import React, { useState, useEffect, useRef } from "react";
import dbx from "../dropbox";
import "./Dashboard.css";

function Dashboard({ user }) {

    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState(""); 
    const [due, setDue] = useState(""); 
    const [priority, setPriority] = useState("Low");
    const [file, setFile] = useState(null);
    const [editId, setEditId] = useState(null);
    const fileInputRef = useRef(null);
    const { logout } = useAuth0();
const getTasks = async () => {
    try {

        const response = await fetch(
            `http://localhost:5000/api/tasks/${user.sub}`
        );

        if (!response.ok) {
            throw new Error("Failed to fetch tasks");
        }

        const data = await response.json();

        const taskList = data.map(task => ({
            id: task._id,
            ...task
        }));

        setTasks(taskList);

    } catch (error) {

        console.log("Get tasks error:", error);
        alert("Error loading tasks");

    }
};
useEffect(() => {

    if(user){
        getTasks();
    }

}, [user]);

const uploadToDropbox = async () => {

    if (!file) {
        return null;
    }

    try {

        const response = await dbx.filesUpload({
            path: "/" + file.name,
            contents: file,
            mode: { ".tag": "add" }
        });

        const filePath = response.result.path_display;
        const linkResponse =
            await dbx.sharingCreateSharedLinkWithSettings({
                path: filePath
            });

        return {
            name: file.name,
            path: filePath,
            url: linkResponse.result.url
        };

    } catch (error) {

        console.log("Dropbox upload error:", error);

        alert("Error uploading file to Dropbox");

        return null;
    }
};

const addTask = async () => {

    if (title.trim() === "" || description.trim() === "") {
        alert("Please fill all fields");
        return;
    }

    try {

        const oldTask = editId !== null
            ? tasks.find(task => task.id === editId)
            : null;

        let dropboxFile = null;

        // If editing and a new file was selected
        if (editId !== null && file) {

            // Delete old Dropbox file
            if (oldTask && oldTask.filePath) {

                await dbx.filesDeleteV2({
                    path: oldTask.filePath
                });

            }

            // Upload new file
            dropboxFile = await uploadToDropbox();

        }

        // If adding a completely new task
        if (editId === null && file) {

            dropboxFile = await uploadToDropbox();

        }

        const taskData = {

            title,
            description,
            due,
            priority,
            uid: user.sub,

            fileName: dropboxFile
                ? dropboxFile.name
                : oldTask?.fileName || "",

            filePath: dropboxFile
                ? dropboxFile.path
                : oldTask?.filePath || "",

            fileUrl: dropboxFile
                ? dropboxFile.url
                : oldTask?.fileUrl || ""

        };


        // EDIT TASK
        if (editId !== null) {

            const response = await fetch(
                `http://localhost:5000/api/tasks/${editId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(taskData)
                }
            );

            if (!response.ok) {
                throw new Error("Failed to update task");
            }

            alert("Task Updated Successfully!");

            setEditId(null);

        }

        // ADD TASK
        else {

            const response = await fetch(
                "http://localhost:5000/api/tasks",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(taskData)
                }
            );

            if (!response.ok) {
                throw new Error("Failed to add task");
            }

            alert("Task Added Successfully!");

        }

        await getTasks();

        // Clear form
        setTitle("");
        setDescription("");
        setDue("");
        setPriority("Low");
        setFile(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

    } catch (error) {

        console.log("Task error:", error);

        alert("Error saving task");

    }
};
const deleteTask = async (task) => {

    try {

        // Delete file from Dropbox first
        if (task.filePath) {

            await dbx.filesDeleteV2({
                path: task.filePath
            });

        }

        // Delete task from MongoDB
        const response = await fetch(
            `http://localhost:5000/api/tasks/${task.id}`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            throw new Error("Failed to delete task");
        }

        await getTasks();

        alert("Task and attached file deleted successfully!");

    } catch (error) {

        console.log("Delete error:", error);

        alert("Error deleting task");

    }

};
const editTask = (task) => {
    setTitle(task.title);
    setDescription(task.description);
    setDue(task.due);
    setPriority(task.priority);
    setEditId(task.id);
    document.getElementById("taskForm").scrollIntoView({
        behavior: "smooth"
    });
};
const handleLogout = () => {

    logout({
        logoutParams: {
            returnTo: window.location.origin
        }
    });

};
    return (
        <div className="dashboard">
            {/* Navbar */}
            <nav className="navbar">
                <h2>☁ Cloud Task Manager</h2>
                <div className="profile">
                    <span>👤 {user.name}</span>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            </nav>
            {/* Add Task */}

            <div className="task-form" id="taskForm">

                <h2>Add New Task</h2>

                <input
                    type="text"
                    placeholder="Task Name"
                    value={title}
                    onChange={(e)=>setTitle(e.target.value)}
/>

                <textarea
    placeholder="Task Description"
    value={description}
    onChange={(e)=>setDescription(e.target.value)}
></textarea>
                <input
type="date"
value={due}
onChange={(e)=>setDue(e.target.value)}
/>
                <select
value={priority}
onChange={(e)=>setPriority(e.target.value)}
>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                </select>
                <input
                    type="file" ref={fileInputRef} onChange={(e) => setFile(e.target.files[0])}
                />
                <button onClick={addTask}>
    {editId !== null ? "Save Changes" : "Add Task"}
</button>
            </div>
            {/* Task List */}
            <div className="task-list">
                <h2>My Tasks</h2>
                {
                    tasks.map((task) => (

                        <div className="task-card" key={task.id}>

                            <h3>{task.title}</h3>

                            <p>{task.description}</p>

                            <p>

                                📅 {task.due}
                                {task.fileUrl && (
    <p>
        📎{" "}
        <a
            href={task.fileUrl}
            target="_blank"
            rel="noreferrer"
        >
            {task.fileName}
        </a>
    </p>
)}
                            </p>

                            <span className={task.priority.toLowerCase()}>

                                {task.priority}

                            </span>

                            <div className="buttons">

                                <button className="edit" onClick={() => editTask(task)}>

                                    Edit

                                </button>

                                <button className="delete" onClick={() => deleteTask(task)}>

                                    Delete

                                </button>

                            </div>

                        </div>

                    ))

                }

            </div>

        </div>

    );

}

export default Dashboard;