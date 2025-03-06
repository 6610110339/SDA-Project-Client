"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "bootstrap/dist/css/bootstrap.min.css";
import { Navbar, Nav, Container, Button, Modal, ListGroup } from "react-bootstrap";
import { Collapse, Tag, Avatar, Card, notification, Space } from 'antd';
import ProfileMenu from "../ProfileMenu";
const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_IP;

export default function Skills() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [token, setToken] = useState(null);
  const [userCharacters, setUserCharacters] = useState(null);
  const [userUpgrades, setUserUpgrades] = useState(null);
  const [showClassPopup, setShowClassPopup] = useState(false);
  const [showCreateUpgrade, setShowCreateUpgrade] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isIsNoCoins, setIsNoCoins] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmUpgrade, setConfirmUpgrade] = useState({ show: false, type: "" });

  const cardStyle = {
    width: "250px",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    className: "hover-effect",
    justifyContent: "space-between",
    testAlign: "center",
    alignItems: "center"
  };

  const upgadeCost = {
    Upgrade_Price: 30
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setToken(token);
    if (!token) {
      router.push("/login");
      localStorage.removeItem("authToken");
      return;
    } else {
      setIsLoggedIn(true);
    }

    fetchUserRole();
  }, []);

  const handleUpgradeConfirm = (type) => {
    setConfirmUpgrade({ show: true, type });
  };

  const handleUpgradeCancel = () => {
    setConfirmUpgrade({ show: false, type: "" });
  };

  const handleUpgradeProceed = async () => {
    if (confirmUpgrade.type) {
      await updateUpgradeData(confirmUpgrade.type);
      setConfirmUpgrade({ show: false, type: "" });
    }
  };

  const fetchUserRole = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${strapiUrl}/api/users/me?populate=*`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch user data");

      const userData = await response.json();
      setUserData(userData);
      localStorage.setItem("userData", JSON.stringify(userData));
      setUserCharacters(userData.character);
      setUserUpgrades(userData.upgrade);
      setUserRole(userData.role.name);

      if (!userData.character) {
        setShowClassPopup(true);
        return;
      };

      if (!userData.skill) {
        setShowCreateUpgrade(true);
        handleCreate(userData, token);
        setTimeout(() => {
          setShowCreateUpgrade(false);
          setIsLoading(false);
          fetchUserRole();
        }, 1500);
      } else {
        setIsLoading(false);
      }

    } catch (error) {
      console.error("Error fetching user role:", error);
      setUserRole("NULL");
    }
  };

  const handleCreate = async (userData, token) => {
    try {
      if (isCreating) return;
      setIsCreating(true);
      const userDocumentId = String(userData.documentId);

      const response = await fetch(`${strapiUrl}/api/skills?populate=*&filters[owner][documentId][$eq]=${userDocumentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!data.data || data.data.length > 1) {
        throw new Error("Error!");
      };

      const newData = {
        Skill_ID: "FIRE_BALL",
        Skill_Name: "Fire Ball",
        Skill_Level: 1,
        Skill_BaseDamage: 4,
        owner: userData.documentId
      };

      const updateResponse = await fetch(`${strapiUrl}/api/skills`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: newData }),
      });

      if (!updateResponse.ok) {
        throw new Error("Error!");
      }

      setIsCreating(false);
      return true;

    } catch (error) {
      console.error("Error Creating Upgrade:", error);
    }
  };

  const updateUpgradeData = async () => {
    try {
      const userDocumentId = String(userData.documentId);
      const upgragePrice = upgadeCost.Upgrade_Price + (Number(userData?.skill?.Skill_Level) * upgadeCost.Upgrade_Price);
      setIsPaying(true);

      const response = await fetch(`${strapiUrl}/api/skills?populate=*&filters[owner][documentId][$eq]=${userDocumentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!data.data || data.data.length === 0) {
        setIsPaying(false);
        throw new Error("Error!");
      };

      const character = data.data[0];
      const characterId = character.documentId;

      if (userData.character.Value_Coins >= upgragePrice) { } else {
        setIsPaying(false);
        setIsNoCoins(true);
        setTimeout(() => {
          setIsNoCoins(false);
        }, 1500)
        return;
      };

      let newData_Upgrade = {};
      handleCoinsCost(upgragePrice);

      let upgrageValue = Number(userData.skill?.Skill_Level + 1);
      newData_Upgrade = {
        Skill_Level: Number(upgrageValue),
      };

      const updateResponse = await fetch(`${strapiUrl}/api/skills/${characterId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: newData_Upgrade }),
      });

      if (!updateResponse.ok) {
        setIsPaying(false);
        throw new Error("Error!");
      }

    } catch (error) {
      setIsPaying(false);
      console.error("Error claiming reward:", error);
    }
  };

  const handleCoinsCost = async (price) => {
    try {

      const userDocumentId = String(userData.documentId);

      const response = await fetch(`${strapiUrl}/api/characters?populate=*&filters[owner][documentId][$eq]=${userDocumentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!data.data || data.data.length === 0) {
        setIsPaying(false);
        throw new Error("Error!");
      };

      const character = data.data[0];
      const characterId = character.documentId;

      let updatedXP = Number(character.Value_XP);
      let updatedCoins = Number(character.Value_Coins - price);
      let updatedLevel = Number(character.Value_Level)

      const newData = {
        Value_XP: updatedXP,
        Value_Coins: updatedCoins,
        Value_Level: updatedLevel
      };

      const updateResponse = await fetch(`${strapiUrl}/api/characters/${characterId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: newData }),
      });

      if (!updateResponse.ok) {
        setIsPaying(false);
        throw new Error("Error!");
      }

      const sound_effect = new Audio("/sounds/ui_buy.mp3");
      sound_effect.volume = 0.25
      sound_effect.play()

      fetchUserRole();
      setIsPaying(false);

    } catch (error) {
      setIsPaying(false);
      console.error("Error claiming reward:", error);
    }
  };

  const handleSelect = async (skill_id) => {
    try {
      const userDocumentId = String(userData.documentId);
      setIsSelecting(true);

      const response = await fetch(`${strapiUrl}/api/skills?populate=*&filters[owner][documentId][$eq]=${userDocumentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!data.data || data.data.length === 0) {
        throw new Error("Error!");
      };

      const character = data.data[0];
      const characterId = character.documentId;

      let newData_Upgrade = {};

      if (skill_id == "FIRE_BALL") {
        newData_Upgrade = {
          Skill_ID: "FIRE_BALL",
          Skill_Name: "Fire Ball",
          Skill_BaseDamage: "4"
        };
      } else {
        if (skill_id == "FROZEN_SPIKE") {
          newData_Upgrade = {
            Skill_ID: "FROZEN_SPIKE",
            Skill_Name: "Frozen Spike",
            Skill_BaseDamage: "3"
          };
        } else {

        }
      }

      const updateResponse = await fetch(`${strapiUrl}/api/skills/${characterId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: newData_Upgrade }),
      });

      if (!updateResponse.ok) {
        setIsPaying(false);
        throw new Error("Error!");
      }

      setIsSelecting(false);
      fetchUserRole();

    } catch (error) {
      console.error("Error claiming reward:", error);
    }
  };

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm" fixed="top">
        <Container>
          <Navbar.Brand className="fw-bold">
            ⚔️ RPG Online - Skills
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link onClick={() => router.push("/stagelist")}>Back to Menu</Nav.Link>
              <Nav.Link
                style={{ color: "gold" }}
              >Coins: {userData?.character.Value_Coins ?? "Loading..."}
              </Nav.Link>
              <Nav.Link className="fw-bold text-white">
                {userData?.username}
              </Nav.Link>
              {token && (
                <ProfileMenu />
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <div style={{ display: "flex", justifyContent: "center", padding: "80px 20px", minHeight: "100vh", backgroundImage: "url('/bg_skills.png')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundAttachment: "fixed" }}>
        {isLoading ? ("") : (
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", width: "100%", maxWidth: "1000px",
            height: "550px",
            backgroundColor: "rgba(255, 255, 255, 0.5)", padding: "20px",
            borderRadius: "1rem"
          }}>
            <Card
              title="🌀 Upgrade Skill"
              variant="borderless"
              style={cardStyle}
            >
              <div style={{ flexGrow: 1 }}>
                <img
                  src={`/Skills/${userData?.skill?.Skill_ID}.png`}
                  style={{
                    width: "200px", height: "200px",
                    objectFit: "cover", borderRadius: "10px",
                    marginBottom: "10px"
                  }}
                />
                <p style={{ height: "5px" }}><strong>Skill: {userData?.skill?.Skill_Name ?? "?"}</strong></p>
                <p style={{ height: "5px" }}><strong>Current Level: {userData?.skill?.Skill_Level ?? "?"}</strong></p>
                <p style={{ height: "5px" }}><strong>Damage: +{(Number(userData?.skill?.Skill_Level) * userData?.skill?.Skill_BaseDamage)} 🌀 Damage</strong></p>
                <p style={{ height: "20px" }}><strong>Upgrade Cost: {upgadeCost.Upgrade_Price + (Number(userData?.skill?.Skill_Level) * upgadeCost.Upgrade_Price)} Coins</strong></p>
                <button type="button" className="btn btn-outline-primary"
                  onClick={() => handleUpgradeConfirm("Upgrade_Health")}
                  style={{ width: "100%" }}
                >Upgrade
                </button>
              </div>
            </Card>
            <Card
              title="📖 Skills List"
              variant="borderless"
              style={
                {
                  width: "700px",
                  height: "100%",
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  className: "hover-effect",
                }
              }
            >
              <div style={{
                flexGrow: 1, justifyContent: "space-between",
                display: "flex", justifyContent: "space-between", width: "100%", maxWidth: "800px",
              }}>
                <Card
                  title="🔥 Fire Ball"
                  variant="borderless"
                  style={
                    {
                      width: "300px",
                      height: "50%",
                      backgroundColor: "rgba(255, 255, 255, 0.8)",
                      className: "hover-effect",
                      justifyContent: "space-between",
                      testAlign: "center",
                      alignItems: "center"
                    }
                  }
                >
                  <img
                    src={`/Skills/FIRE_BALL.png`}
                    style={{
                      width: "100%", height: "80%",
                      objectFit: "cover", borderRadius: "10px",
                      marginBottom: "10px"
                    }}
                  />
                  <button type="button" className="btn btn-outline-primary"
                    onClick={() => handleSelect("FIRE_BALL")}
                    style={{ width: "100%" }}
                    disabled={userData?.skill?.Skill_ID == "FIRE_BALL"}
                  >{(userData?.skill?.Skill_ID == "FIRE_BALL" ? ("Selected") : ("Select"))}
                  </button>
                </Card>
                <Card
                  title="🧊 Frozen Spike"
                  variant="borderless"
                  style={
                    {
                      width: "300px",
                      height: "50%",
                      backgroundColor: "rgba(255, 255, 255, 0.8)",
                      className: "hover-effect",
                      justifyContent: "space-between",
                      testAlign: "center",
                      alignItems: "center"
                    }
                  }
                >
                  <img
                    src={`/Skills/FROZEN_SPIKE.png`}
                    style={{
                      width: "100%", height: "80%",
                      objectFit: "cover", borderRadius: "10px",
                      marginBottom: "10px"
                    }}
                  />
                  <button type="button" className="btn btn-outline-primary"
                    onClick={() => handleSelect("FROZEN_SPIKE")}
                    style={{ width: "100%" }}
                    disabled={userData?.skill?.Skill_ID == "FROZEN_SPIKE"}
                  >{(userData?.skill?.Skill_ID == "FROZEN_SPIKE" ? ("Selected") : ("Select"))}
                  </button>
                </Card>
              </div>
            </Card>
          </div>
        )}
      </div >

      <Modal show={confirmUpgrade.show} backdrop="static" keyboard={false} centered>
        <Modal.Header>
          <Modal.Title>Confirmation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure to upgrade?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" disabled={isPaying} onClick={handleUpgradeCancel}>Cancel</Button>
          <Button variant="primary" disabled={isPaying} onClick={handleUpgradeProceed}>Upgrade</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showClassPopup} backdrop="static" keyboard={false} centered>
        <Modal.Header>
          <Modal.Title>Please select your class</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>You need to select a class before starting the game.</p>
          <Button variant="primary" onClick={() => router.push('/selectclass')}>
            Select Class
          </Button>
        </Modal.Body>
      </Modal>

      <Modal show={isIsNoCoins} backdrop="static" keyboard={false} centered>
        <Modal.Header>
          <Modal.Title>Error!</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Not Enough Coins!</p>
        </Modal.Body>
      </Modal>

      <Modal show={isSelecting} backdrop="static" keyboard={false} centered>
        <Modal.Header>
          <Modal.Title>Please wait</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Selecting...</p>
        </Modal.Body>
      </Modal>

      <Modal show={showCreateUpgrade} backdrop="static" keyboard={false} centered>
        <Modal.Header>
          <Modal.Title>Please wait</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Loading Upgrade...</p>
        </Modal.Body>
      </Modal>
    </>
  );
}
