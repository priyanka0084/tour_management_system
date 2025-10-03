import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FaTachometerAlt,
  FaUsers,
  FaClipboardList,
  FaPlane,
  FaMoneyBill,
  FaPlus,
  FaLock,
  FaUnlock,
} from "react-icons/fa";

function AdminDashboard3D() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Users
  const [users, setUsers] = useState([
    { id: 1, name: "Akalya", email: "akalya@example.com", status: "Active" },
    { id: 2, name: "Kumar", email: "kumar@example.com", status: "Blocked" },
  ]);

  // Activities
  const [activities] = useState([
    { id: 1, user: "Akalya", action: "Booked Paris Trip", date: "2025-09-01" },
    { id: 2, user: "Kumar", action: "Tried Payment", date: "2025-09-02" },
  ]);

  // Destinations
  const [destinations, setDestinations] = useState([
    { id: 1, place: "Paris", description: "City of Lights", price: "₹50,000" },
  ]);
  const [newDestination, setNewDestination] = useState({
    place: "",
    description: "",
    price: "",
  });

  const addDestination = () => {
    if (
      !newDestination.place.trim() ||
      !newDestination.description.trim() ||
      !newDestination.price.trim()
    )
      return;

    const newId = destinations.length + 1;
    setDestinations([...destinations, { id: newId, ...newDestination }]);
    setNewDestination({ place: "", description: "", price: "" });
  };

  // Toggle user status
  const toggleUserStatus = (id) => {
    setUsers(
      users.map((u) =>
        u.id === id
          ? { ...u, status: u.status === "Active" ? "Blocked" : "Active" }
          : u
      )
    );
  };

  return (
    <div style={styles.dashboardContainer}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <h2 style={styles.logo}>🌸 ExploreEase</h2>
        <ul style={styles.sidebarList}>
          {[
            { key: "dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
            { key: "users", label: "Users", icon: <FaUsers /> },
            { key: "bookings", label: "Bookings", icon: <FaClipboardList /> },
            { key: "destinations", label: "Destinations", icon: <FaPlane /> },
            { key: "payments", label: "Payments", icon: <FaMoneyBill /> },
          ].map((item) => (
            <li
              key={item.key}
              style={{
                ...styles.sidebarItem,
                background:
                  activeTab === item.key ? "rgba(255,255,255,0.4)" : "transparent",
                color: activeTab === item.key ? "#000" : "#f9f9f9",
              }}
              onClick={() => setActiveTab(item.key)}
            >
              {item.icon} {item.label}
            </li>
          ))}
        </ul>
      </aside>

      {/* Main content */}
      <main style={styles.mainContent}>
        <header style={styles.topbar}>
          <h1>✨ Admin Dashboard</h1>
        </header>

        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div style={styles.cards}>
            {["Users", "Bookings", "Destinations", "Payments"].map((item, i) => (
              <motion.div
                key={i}
                style={styles.card}
                whileHover={{ scale: 1.08, rotateY: 8 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {item === "Users" && "👤"}
                {item === "Bookings" && "📑"}
                {item === "Destinations" && "🌍"}
                {item === "Payments" && "💳"}
                <p>{item}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Users */}
        {activeTab === "users" && (
          <section style={styles.glassSection}>
            <h2>👤 Manage Users</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    style={{ background: u.status === "Blocked" ? "#ffd6d6" : "" }}
                  >
                    <td>{u.id}</td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.status}</td>
                    <td>
                      <button
                        onClick={() => toggleUserStatus(u.id)}
                        style={styles.button}
                      >
                        {u.status === "Active" ? (
                          <>
                            <FaLock /> Block
                          </>
                        ) : (
                          <>
                            <FaUnlock /> Unblock
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 style={{ marginTop: "20px" }}>📜 User Activities</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td>{a.user}</td>
                    <td>{a.action}</td>
                    <td>{a.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Bookings */}
        {activeTab === "bookings" && (
          <section style={styles.glassSection}>
            <h2>📑 Booking Details</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Destination</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>101</td>
                  <td>Akalya</td>
                  <td>Paris</td>
                  <td>Confirmed</td>
                </tr>
              </tbody>
            </table>
          </section>
        )}

        {/* Destinations */}
        {activeTab === "destinations" && (
          <section style={styles.glassSection}>
            <h2>🌍 Destinations</h2>
            <div style={styles.addDestination}>
              <input
                type="text"
                placeholder="Place..."
                value={newDestination.place}
                onChange={(e) =>
                  setNewDestination({ ...newDestination, place: e.target.value })
                }
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Description..."
                value={newDestination.description}
                onChange={(e) =>
                  setNewDestination({
                    ...newDestination,
                    description: e.target.value,
                  })
                }
                style={styles.input}
              />
              <input
                type="text"
                placeholder="Price..."
                value={newDestination.price}
                onChange={(e) =>
                  setNewDestination({ ...newDestination, price: e.target.value })
                }
                style={styles.input}
              />
              <button onClick={addDestination} style={styles.button}>
                <FaPlus /> Add
              </button>
            </div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Place</th>
                  <th>Description</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {destinations.map((dest) => (
                  <tr key={dest.id}>
                    <td>{dest.id}</td>
                    <td>{dest.place}</td>
                    <td>{dest.description}</td>
                    <td>{dest.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Payments */}
        {activeTab === "payments" && (
          <section style={styles.glassSection}>
            <h2>💳 Payments</h2>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Booking ID</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>501</td>
                  <td>101</td>
                  <td>₹20,000</td>
                  <td>Paid</td>
                </tr>
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  );
}

/* Inline CSS */
const styles = {
  dashboardContainer: {
    display: "flex",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #ffd6e0, #ffe6f1)",
    fontFamily: "Segoe UI, sans-serif",
  },
  sidebar: {
    width: "230px",
    background: "rgba(255, 133, 162, 0.85)",
    backdropFilter: "blur(12px)",
    color: "white",
    padding: "20px",
    boxShadow: "4px 0 12px rgba(0,0,0,0.1)",
  },
  logo: { fontSize: "22px", marginBottom: "30px", textAlign: "center" },
  sidebarList: { listStyle: "none", padding: 0 },
  sidebarItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px",
    cursor: "pointer",
    borderRadius: "6px",
    transition: "all 0.3s",
  },
  mainContent: { flexGrow: 1, padding: "20px" },
  topbar: {
    background: "rgba(255,255,255,0.5)",
    padding: "15px",
    borderRadius: "12px",
    marginBottom: "20px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "15px",
    marginBottom: "20px",
  },
  card: {
    background: "rgba(255, 255, 255, 0.7)",
    padding: "30px",
    borderRadius: "15px",
    textAlign: "center",
    fontSize: "18px",
    fontWeight: "bold",
    boxShadow: "0 6px 12px rgba(0,0,0,0.2)",
  },
  glassSection: {
    background: "rgba(255, 255, 255, 0.9)",
    padding: "20px",
    borderRadius: "15px",
    boxShadow: "0 6px 15px rgba(0,0,0,0.2)",
    marginBottom: "20px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
  },
  input: {
    flex: 1,
    padding: "10px",
    border: "2px solid #ff85a2",
    borderRadius: "8px",
  },
  button: {
    background: "#ff85a2",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },
  addDestination: {
    display: "flex",
    gap: "10px",
    marginBottom: "15px",
  },
};

/* Add zebra striping */
const tableStyle = document.createElement("style");
tableStyle.innerHTML = `
  table th, table td {
    padding: 12px;
    border: 1px solid rgba(0,0,0,0.1);
    text-align: left;
  }
  table tbody tr:nth-child(even) {
    background: rgba(255,133,162,0.15);
  }
`;
document.head.appendChild(tableStyle);

export default AdminDashboard3D;