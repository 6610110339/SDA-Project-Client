"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "bootstrap/dist/css/bootstrap.min.css";
import { Navbar, Nav, Container, Button, Modal, ListGroup } from "react-bootstrap";
import "./menu.css";
import ProfileMenu from "../ProfileMenu";
const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_IP;

export default function MainMenu() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showModalLogout, setShowModalLogout] = useState(false);
  const [token, setToken] = useState(null);
  const [userCharacters, setUserCharacters] = useState(null);
  const [showClassPopup, setShowClassPopup] = useState(false);
  const [showHTP, setShowHTP] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

    const fetchUserRole = async () => {
      try {
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
        setUserRole(userData.role.name);

        if (!userData.character) {
          setShowClassPopup(true);
          return;
        };

        setIsLoading(false);

      } catch (error) {
        console.error("Error fetching user role:", error);
        setUserRole("NULL");
      }
    };

    fetchUserRole();

  }, []);

  const buttonLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("authToken");
    router.push("/login");
  };

  return (
    <div className="main-menu-container">

      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm" fixed="top">
        <Container>
          <Navbar.Brand className="fw-bold">
            ⚔️ RPG Online
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
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

      <div className="menu-card">
        <h1 className="menu-title">Welcome to RPG Online</h1>
        {isLoading ? ("") : (
          <div className="menu-buttons">
            <Button
              variant="success"
              size="lg"
              onClick={() => router.push("/stagelist")}
              className="hover-effect text-black"
            >
              Start Game
            </Button>
            <Button
              variant="info"
              size="lg"
              onClick={() => setShowHTP(true)}
              className="hover-effect text-black"
            > How to Play
            </Button>
            {userRole === "Admin" && (
              <Button
                variant="warning"
                size="lg"
                onClick={() => router.push("/admin")}
                className="hover-effect text-black"
              >
                Admin Panel
              </Button>
            )}
          </div>

        )}
      </div>

      {/* Logout Modal */}
      <Modal show={showModalLogout} onHide={() => setShowModalLogout(false)} centered>
        <Modal.Header>
          <Modal.Title>Are you sure?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex gap-2">
            <Button className="w-50" variant="secondary" onClick={() => setShowModalLogout(false)}>Cancel</Button>
            <Button className="w-50" variant="danger" onClick={() => buttonLogout()}>Logout</Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* How to Play Modal */}
      <Modal show={showHTP} onHide={() => setShowHTP(false)} centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title>How to Play</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="gap-2">
            <p><strong>1) Select Class</strong></p>
            <img
              src="/HTP/1.png"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <img
              src="/HTP/2.png"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <p><strong>2) Start Game</strong></p>
            <img
              src="/HTP/3.png"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <p><strong>3) Select Stage and ATTACK</strong></p>
            <img
              src="/HTP/4.png"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <p><strong>4) Gameplay</strong></p>
            <img
              src="/HTP/5.png"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <p><strong>5) Turn UI</strong></p>
            <img
              src="/HTP/7.png"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <p><strong>6) Stats UI</strong></p>
            <img
              src="/HTP/8.png"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <p><strong>7) Stage Reward</strong></p>
            <img
              src="/HTP/6.png"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <p><strong>8) Upgrade Shop</strong></p>
            <img
              src="/HTP/9.png"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <p><strong>9) Upgrade Skill</strong></p>
            <img
              src="/HTP/10.png"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        </Modal.Body>
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
    </div>
  );
}

