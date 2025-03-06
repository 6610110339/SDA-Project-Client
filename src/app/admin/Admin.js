"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "bootstrap/dist/css/bootstrap.min.css";
import { Navbar, Nav, Container, Modal, ListGroup, Form, Card } from "react-bootstrap";
import { UserOutlined } from '@ant-design/icons';
import { Collapse, Button, Tag, Avatar } from 'antd';
import ProfileMenu from "../ProfileMenu";
const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_IP;

export default function Admin() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [token, setToken] = useState(null);
  const [userCharacters, setUserCharacters] = useState(null);
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
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch user data");

        const userData = await response.json();
        setUserData(userData);
        localStorage.setItem("userData", JSON.stringify(userData));
        setUserRole(userData.role.name);
        if (userData.role.name !== "Admin") router.push("/menu");
      } catch (error) {
        console.error("Error fetching user role:", error);
        setUserRole("NULL");
        router.push("/menu");
      }
    };

    const fetchCharacters = async () => {
      try {
        const response = await fetch(`${strapiUrl}/api/characters?populate=*`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch user data");

        const userData = await response.json();
        setUserCharacters(userData);
        setIsLoading(false);

      } catch (error) {
        console.error("Error fetching user role:", error);
        setUserRole("NULL");
        router.push("/menu");
      }
    };

    fetchUserRole();
    fetchCharacters();
  }, []);

  return (
    <>

      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm" fixed="top">
        <Container>
          <Navbar.Brand className="fw-bold">
            🛠️ RPG Online - Admin Panel
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link onClick={() => router.push("/menu")}>
                Back to Menu
              </Nav.Link>
              {token && (
                <ProfileMenu />
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "80px 20px",
          minHeight: "100vh",
          backgroundImage: "url('/admin_bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "700px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            padding: "20px",
            borderRadius: "1rem",
          }}
        >
          <ListGroup className="shadow-lg rounded-4 overflow-hidden">
            <ListGroup.Item className="bg-primary text-white fw-bold fs-5">
              👥 Manage Users
            </ListGroup.Item>
            {isLoading ? ("") : (
              userCharacters.data?.map((user) => (
                <Card key={user.id} className="m-3 shadow-sm">
                  <Card.Body>
                    <Card.Title className="fw-bold">{user.owner.username}</Card.Title>
                    <Card.Text>
                      Class: <span className="text-info">{user.Class_Name}</span>
                    </Card.Text>
                    <Card.Text>
                      Level: <span className="text-info">{user.Value_Level}</span>
                    </Card.Text>
                    <Card.Text>
                      Coins: <span className="text-info">{user.Value_Coins}</span>
                    </Card.Text>
                  </Card.Body>
                </Card>
              ))
            )}
          </ListGroup>
        </div>
      </div>
    </>
  );
}
