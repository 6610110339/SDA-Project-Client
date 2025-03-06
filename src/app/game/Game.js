"use client";

import { useEffect, useState, } from "react";
import { useRouter, usePathname } from "next/navigation";
import "bootstrap/dist/css/bootstrap.min.css";
import { Navbar, Nav, Container, Button, Modal } from "react-bootstrap";
import { Flex, Card, Tooltip } from 'antd';
import "../globals.css";
const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_IP;

export default function Game() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [token, setToken] = useState(null);
  const [userCharacters, setUserCharacters] = useState(null);
  const [userUpgrades, setUserUpgrades] = useState(null);
  const [userSkills, setUserSkills] = useState(null);
  const [showModalReturn, setShowModalReturn] = useState(false);
  const [showModalErrorInstance, setShowModalErrorInstance] = useState(false);
  const [showModalEnd, setShowModalEnd] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [stage, setStage] = useState(null);
  const [instanceID, setInstanceID] = useState(null);

  const [currentTurn, setCurrentTurn] = useState("👤 Player");
  const [currentEffect, setCurrentEffect] = useState("NONE");
  const [charactersPoint, setCharactersPoint] = useState(0)
  const [charactersDamage, setCharactersDamage] = useState(20);
  const [charactersDefense, setCharactersDefense] = useState(20);
  const [charactersBonusSkill, setCharactersBonusSkill] = useState(20);
  const [charactersHP, setCharactersHP] = useState(20);
  const [charactersMaxHP, setCharactersMaxHP] = useState(20);
  const [isCharactersDefeated, setIsCharactersDefeated] = useState(false);
  const [monsterList, setMonsterList] = useState([]);
  const [monsterEffect, setMonsterEffect] = useState([]);
  const [currentMonsterIndex, setCurrentMonsterIndex] = useState(0);
  const [monsterHP, setMonsterHP] = useState(100);
  const [isMonsterDefeated, setIsMonsterDefeated] = useState(false);
  const [isMonsterHit, setIsMonsterHit] = useState(false);
  const [isMonsterLoaded, setIsMonsterLoaded] = useState(false);
  const [isCharacterHit, setIsCharacterHit] = useState(false);
  const [isProc, setIsProc] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnknown, setIsUnknown] = useState(false);
  const [dataRewardCoins, setDataRewardCoins] = useState(0)
  const [dataRewardXP, setDataRewardXP] = useState(0)

  const baseStyle = {
    width: '100%',
    height: 54,
  };

  const handleReturn = async (instanceID) => {
    setIsClosing(true);
    try {
      const fetchResponse = await fetch(`${strapiUrl}/api/active-stage-list`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!fetchResponse.ok) {
        setIsClosing(false);
        throw new Error("Failed to fetch existing data")
      };

      const existingData = await fetchResponse.json();
      let updatedJSON = existingData.data.JSON || [];

      updatedJSON = updatedJSON.filter(stage => stage.instanceID != instanceID);

      const updateResponse = await fetch(`${strapiUrl}/api/active-stage-list`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: { JSON: updatedJSON } }),
      });

      if (!updateResponse.ok) {
        setIsClosing(false);
        throw new Error("Failed to update active-stage-list in Strapi")
      };

      if (typeof window !== "undefined") {
        localStorage.removeItem("selectStage");
        localStorage.removeItem("instanceID");
        localStorage.removeItem("userData");
        localStorage.removeItem("rewardCoins");
        localStorage.removeItem("rewardXP");
      };

      router.push("/stagelist");
    } catch (error) {
      setIsClosing(false);
      console.error("Error removing active stage:", error);
    }
  };

  const handleClaim = async () => {
    try {
      let rewardXP = 0;
      let rewardCoins = 0;
      if (typeof window !== "undefined") {
        rewardXP = Number(localStorage.getItem("rewardXP"));
        rewardCoins = Number(localStorage.getItem("rewardCoins"));
      };

      const userDocumentId = String(userData.documentId);

      const response = await fetch(`${strapiUrl}/api/characters?populate=*&filters[owner][documentId][$eq]=${userDocumentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!data.data || data.data.length === 0) {
        throw new Error("Error!");
      };

      const character = data.data[0];
      const characterId = character.documentId;

      let updatedXP = Number(character.Value_XP + rewardXP);
      let updatedCoins = Number(character.Value_Coins + rewardCoins);
      let updatedLevel = Number(character.Value_Level)

      while (updatedXP >= (character.Value_Level * 15)) {
        updatedLevel = updatedLevel + 1;
        updatedXP = updatedXP - Number(character.Value_Level * 15)
      };

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
        throw new Error("Error!");
      }

    } catch (error) {
      console.error("Error claiming reward:", error);
    }
  };

  const handlePlayerAttack = () => {
    setIsProc(true);
    const monster_hurt = new Audio("/sounds/monster_hurt.mp3");
    const monsterDefense = Number(monsterList[currentMonsterIndex].defense)
    const damageReduction = Number((monsterDefense / (monsterDefense + 100)) * 100).toFixed(0)
    const damageValue = ((charactersDamage * (100 - Number(damageReduction))) / 100).toFixed(0)
    setCharactersPoint(charactersPoint + 1);
    if (monsterHP >= 0) {
      setMonsterHP(monsterHP - Number(damageValue));
      setIsMonsterHit(true);
      setTimeout(() => {
        setIsMonsterHit(false);
      }, 300);
      monster_hurt.volume = 0.25
      monster_hurt.play()
      if ((monsterHP - charactersDamage) <= 0) {
        handleMonsterDied();
        return
      };
      setCurrentTurn("☠️ Monster");
    }
  };

  const handlePlayerSkill = () => {
    setIsProc(true);
    const monster_hurt = new Audio("/sounds/monster_hurt.mp3");
    const monsterDefense = Number(monsterList[currentMonsterIndex].defense)
    const damageReduction = Number((monsterDefense / (monsterDefense + 100)) * 100).toFixed(0)
    const skillDamage = Number((userSkills.Skill_BaseDamage * userSkills.Skill_Level) * (1 + (charactersBonusSkill / 100))).toFixed(0)
    const damageValue = ((Number(skillDamage) * (100 - Number(damageReduction))) / 100).toFixed(0)
    setCharactersPoint(charactersPoint - 2);
    if (userSkills.Skill_ID == "FIRE_BALL") {
      const newEffect = {
        TYPE: "BURNING",
        DAMAGE: Number(((skillDamage * 30) / 100).toFixed(0)),
        DURATION: 3
      }
      setMonsterEffect([...monsterEffect, newEffect]);
    } else {
      if (userSkills.Skill_ID == "FROZEN_SPIKE") {
        const newEffect = {
          TYPE: "STUN",
          DAMAGE: 0,
          DURATION: 1
        }
        setMonsterEffect([...monsterEffect, newEffect]);
      } else {

      }
    }
    if (monsterHP >= 0) {
      setMonsterHP(monsterHP - Number(damageValue));
      setIsMonsterHit(true);
      setTimeout(() => {
        setIsMonsterHit(false);
      }, 300);
      monster_hurt.volume = 0.25
      monster_hurt.play()
      if ((monsterHP - charactersDamage) <= 0) {
        handleMonsterDied();
        setCurrentTurn("☠️ Monster");
        return;
      } else {
        setCurrentTurn("☠️ Monster");
      }
    }
  };

  const handlePlayerHeal = () => {
    const player_heal = new Audio("/sounds/player_heal.mp3");
    const healAmount = Number((charactersMaxHP * 15) / 100).toFixed(0)
    setCharactersPoint(charactersPoint - 2);
    setCharactersHP(charactersHP + Number(healAmount));
    if (charactersHP >= charactersMaxHP) setCharactersHP(charactersMaxHP);
    setIsCharacterHit(true);
    setTimeout(() => {
      setIsCharacterHit(false);
    }, 300);
    player_heal.volume = 0.25
    player_heal.play()
  };

  const handleMonsterDied = () => {
    setIsMonsterDefeated(true);
    setIsMonsterLoaded(false);
    setMonsterEffect([]);
    let rewardCoins = 0;
    let rewardXP = 0;
    if (typeof window !== "undefined") {
      rewardCoins = localStorage.getItem("rewardCoins");
      rewardXP = localStorage.getItem("rewardXP");
      localStorage.setItem("rewardCoins", (Number(rewardCoins) + Number(monsterList[currentMonsterIndex].drops.exp)));
      setDataRewardCoins((Number(rewardCoins) + Number(monsterList[currentMonsterIndex].drops.exp)));
      localStorage.setItem("rewardXP", (Number(rewardXP) + Number(monsterList[currentMonsterIndex].drops.coins)));
      setDataRewardXP((Number(rewardXP) + Number(monsterList[currentMonsterIndex].drops.coins)));
    };
    if (currentMonsterIndex < monsterList.length - 1) {
      setCurrentTurn("☠️ Monster");
      setTimeout(() => {
        setIsMonsterDefeated(false);
        setIsMonsterLoaded(true);
        setCurrentMonsterIndex(currentMonsterIndex + 1);
        setMonsterHP(monsterList[currentMonsterIndex + 1].health);
      }, 1000);
    } else {
      setIsEnded(true);
      setShowModalEnd(true);
      handleClaim();
      return;
    }
  };

  const handleMonsterAttack = () => {
    const player_hurt = new Audio("/sounds/player_hurt.mp3");
    const characterDefense = Number(charactersDefense)
    const damageReduction = Number((characterDefense / (characterDefense + 100)) * 100).toFixed(0)
    const damageValue = ((monsterList[currentMonsterIndex].damage * (100 - Number(damageReduction))) / 100).toFixed(0)
    if (charactersHP >= 0) {
      setCharactersHP(charactersHP - damageValue);
      setIsCharacterHit(true);
      setTimeout(() => {
        setIsCharacterHit(false);
      }, 300);
      player_hurt.volume = 0.25
      player_hurt.play()
      setCurrentTurn("👤 Player")
      setIsProc(false);
      if ((charactersHP - monsterList[currentMonsterIndex].damage) <= 0) {
        setIsCharactersDefeated(true);
        setIsEnded(true);
        setTimeout(() => {
          let instanceID = 0;
          if (typeof window !== "undefined") {
            instanceID = localStorage.getItem("instanceID");
          }
          handleReturn(instanceID);
        }, 3000);
      }
    }
  };

  useEffect(() => {
    if (monsterHP <= 0) {
      setIsMonsterDefeated(true);
      handleMonsterDied();
    };
  }, [monsterHP]);

  useEffect(() => {
    let isStun = false
    if (currentTurn === "☠️ Monster" && !isEnded && !isMonsterDefeated) {
      if (monsterEffect.length > 0) {
        let index = 0;

        const applyEffect = () => {
          if (index < monsterEffect.length && !isMonsterDefeated) {
            const effect = monsterEffect[index];
            setCurrentEffect(effect.TYPE);

            if (effect.TYPE == "BURNING") {
              const monster_hurt = new Audio("/sounds/monster_hurt.mp3");
              const monsterDefense = Number(monsterList[currentMonsterIndex].defense);
              const damageReduction = Number((monsterDefense / (monsterDefense + 100)) * 100).toFixed(0);
              const damageValue = ((effect.DAMAGE * (100 - Number(damageReduction))) / 100).toFixed(0);

              setMonsterHP((prevHP) => {
                const newHP = prevHP - Number(damageValue);
                if (newHP <= 0) {
                  setIsMonsterDefeated(true);
                } else {
                  monster_hurt.volume = 0.25;
                  monster_hurt.play();

                  setIsMonsterHit(true);
                  setTimeout(() => {
                    setIsMonsterHit(false);
                  }, 300);
                }
                return newHP;
              });

              setTimeout(() => {
                if (!isMonsterDefeated) {
                  index++;
                  setCurrentEffect("NONE");
                  applyEffect();
                }
              }, 1000);
            } else {
              if (effect.TYPE == "STUN") {
                isStun = true
                setTimeout(() => {
                  if (!isMonsterDefeated) {
                    index++;
                    setCurrentEffect("NONE");
                    applyEffect();
                  }
                }, 1000);
              } else {

              }
            }

          } else {
            if (!isMonsterDefeated) {
              setMonsterEffect((prevEffects) =>
                prevEffects
                  .map((e) => ({ ...e, DURATION: e.DURATION - 1 }))
                  .filter((e) => e.DURATION > 0)
              );
              setTimeout(() => {
                if (isStun) {
                  setCurrentTurn("👤 Player")
                  setIsProc(false);
                } else {
                  handleMonsterAttack();
                }
              }, 1000);
            }
          }
        };

        setTimeout(() => {
          if (!isMonsterDefeated) {
            setCurrentEffect("NONE");
            applyEffect();
          }
        }, 1000);

      } else {
        setCurrentEffect("NONE");
        setTimeout(() => {
          if (isStun) {
            setCurrentTurn("👤 Player")
            setIsProc(false);
          } else {
            handleMonsterAttack();
          }
        }, 1000);
      }

    }
  }, [currentTurn, isEnded, isMonsterDefeated]);

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

    const selectStage = localStorage.getItem("selectStage");
    setStage(`Stage ${selectStage}`);
    const instanceID = localStorage.getItem("instanceID");
    setInstanceID(instanceID);
    if (!selectStage || !instanceID) {
      setIsUnknown(true);
      setShowModalErrorInstance(true);
      return;
    };

    localStorage.setItem("rewardCoins", 0);
    localStorage.setItem("rewardXP", 0);

    const fetchUserRole = async () => {
      try {
        const response = await fetch(`${strapiUrl}/api/users/me?populate=*`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch user data");

        const userData = await response.json();
        setUserData(userData);
        localStorage.setItem("userData", JSON.stringify(userData));
        setUserCharacters(userData.character);
        setUserRole(userData.role.name);
        setUserUpgrades(userData.upgrade);
        setUserSkills(userData.skill);

        if (!userData.upgrade) {
          setCharactersDamage((Number(userData.character.Value_Level) * 1) + 1);
          setCharactersMaxHP((Number(userData.character.Value_Level) * 15) + 5);
          setCharactersHP((Number(userData.character.Value_Level) * 15) + 5);
          setCharactersDefense((Number(userData.character.Value_Level) * 1) + 1);
          setCharactersBonusSkill((Number(userData.character.Value_Level) * 1) + 1)
        } else {
          setCharactersDamage((userData.upgrade.Upgrade_Damage * 1) + (Number(userData.character.Value_Level) * 1) + 1);
          setCharactersMaxHP((userData.upgrade.Upgrade_Health * 2) + (Number(userData.character.Value_Level) * 15) + 5);
          setCharactersHP((userData.upgrade.Upgrade_Health * 2) + (Number(userData.character.Value_Level) * 15) + 5);
          setCharactersDefense((userData.upgrade.Upgrade_Defense * 1) + (Number(userData.character.Value_Level) * 1) + 1);
          setCharactersBonusSkill((userData.upgrade.Upgrade_Skill * 1) + (Number(userData.character.Value_Level) * 1) + 1);
        };
        setIsCharactersDefeated(false);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user role:", error);
        setUserRole("NULL");
      }
    };
    const fetchMonsterData = async () => {
      try {
        const selectStage = localStorage.getItem("selectStage");
        const response = await fetch(`${strapiUrl}/api/monster-lists?filters[Stage_ID][$eq]=${selectStage}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch monster data");

        const data = await response.json();
        const monsters = data.data[0].MonsterData;

        setMonsterList(monsters);
        if (monsters.length > 0) {
          setMonsterHP(monsters[0].health);
          setIsMonsterLoaded(true);
        }
      } catch (error) {
        console.error("Error fetching monster data:", error);
      }
    };

    fetchMonsterData();
    fetchUserRole();

  }, []);

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm" fixed="top">
        <Container>
          <Navbar.Brand className="fw-bold">
            {stage} - Wave: {currentMonsterIndex + 1}/{monsterList.length}
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link onClick={() => setShowModalReturn(true)}>Return to Menu</Nav.Link>
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
          backgroundImage: "url('/bg_forest.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}>
        <div
          style={{
            width: "100%",
            maxWidth: "100%",
            backgroundColor: "rgba(255, 255, 255, 0.75)",
            padding: "20px",
            borderRadius: "1rem",
          }}>
          {isUnknown ? ("") : (
            <Flex gap="middle" vertical>
              <Flex direction="row">
                {Array.from({
                  length: 4,
                }).map((_, i) => (
                  <div
                    key={i}
                    data-index={i}
                    style={{
                      ...baseStyle,
                      backgroundColor: i % 2 ? 'rgb(255, 255, 255, 0.0)' : 'rgba(0, 0, 0, 0.0)',
                    }}
                  >
                    {i === 0 ? (
                      <div>
                        <Card
                          title={`🔹 Current Turn: ${currentTurn}`}
                          variant="borderless"
                          style={{
                            width: "100%",
                            backgroundColor: "rgba(255, 255, 255, 0.5)"
                          }}
                        >
                          <p style={{ height: "5px" }}><strong style={{ color: "blue" }}>💠 Points: {charactersPoint ?? 0}</strong></p>
                          <p style={{ height: "5px" }}><strong style={{ color: "purple" }}>🌀 Skill: {userSkills?.Skill_Name ?? "???"} (Lv. {userSkills?.Skill_Level ?? "0"})</strong></p>
                          <p style={{ height: "20px" }}><strong style={{ color: "orange" }}>🔶 Action:</strong></p>
                          <div style={{ bottom: "20px", display: "flex", gap: "15px" }}>
                            <Tooltip title="Attack the enemy & Gain 1 💠 Point" color="red" placement="bottom">
                              <button disabled={(currentTurn === "👤 Player" && !isProc) ? (false) : (true)} className="hover-effect"
                                onClick={() => { if (currentTurn === "👤 Player" && !isEnded) handlePlayerAttack() }}
                                style={{
                                  padding: "10px 20px",
                                  fontSize: "18px",
                                  borderRadius: "10px",
                                  backgroundColor: currentTurn === "👤 Player" ? ("red") : ("grey")
                                }}>
                                ⚔️ Attack</button>
                            </Tooltip>
                            <Tooltip title="Use 2 💠 Point to cast spell on enemy" color="blue" placement="bottom">
                              <button disabled={(currentTurn === "👤 Player" && !isProc) ? (false) : (true)} className="hover-effect"
                                onClick={() => {
                                  if (currentTurn === "👤 Player" && !isEnded) {
                                    if (charactersPoint >= 2) handlePlayerSkill()
                                  }
                                }}
                                style={{
                                  padding: "10px 20px",
                                  fontSize: "18px",
                                  borderRadius: "10px",
                                  backgroundColor: currentTurn === "👤 Player" ? ("blue") : ("grey")
                                }}>
                                🌀 Skill</button>
                            </Tooltip>
                            <Tooltip title="Use 2 💠 Point to Heal 15% of MaxHP" color="green" placement="bottom">
                              <button disabled={(currentTurn === "👤 Player" && !isProc) ? (false) : (true)} className="hover-effect"
                                onClick={() => {
                                  if (currentTurn === "👤 Player" && !isEnded) {
                                    if (charactersPoint >= 2) handlePlayerHeal()
                                  }
                                }}
                                style={{
                                  padding: "10px 20px",
                                  fontSize: "18px",
                                  borderRadius: "10px",
                                  backgroundColor: currentTurn === "👤 Player" ? ("lime") : ("grey")
                                }}>
                                💊 Heal</button>
                            </Tooltip>
                          </div>
                        </Card>
                      </div>
                    ) : i === 1 ? (
                      <div className="battle-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", height: "100vh", color: "white", textAlign: "center", padding: "20px" }}>
                        {charactersHP >= 0 ? (
                          <div style={{ textAlign: "center" }}>
                            {isCharactersDefeated ? (
                              <h3 style={{ fontSize: "24px", color: "black" }}>Character Defeated!</h3>
                            ) : (
                              <>
                                <h2 style={{ fontSize: "24px", color: "black" }}>{userData?.username}</h2>
                                <img
                                  className={isCharacterHit ? "monster-hit" : ""}
                                  src={`/Characters/${userData?.character.Class_Name}.png`}
                                  style={{ width: "200px", height: "200px", objectFit: "cover", borderRadius: "10px", marginBottom: "10px" }}
                                />
                                <div className="progress" style={{ width: "300px", height: "18px", backgroundColor: "#333", borderRadius: "5px", margin: "10px auto", position: "relative" }}>
                                  <div className="progress-bar bg-danger"
                                    style={{
                                      width: `${(charactersHP / charactersMaxHP) * 100}%`,
                                      height: "100%",
                                      borderRadius: "5px"
                                    }}>
                                    <span style={{ fontSize: "14px", position: "absolute", width: "100%", textAlign: "center", fontWeight: "bold" }}>
                                      {charactersHP} / {charactersMaxHP}
                                    </span>
                                  </div>
                                </div>
                              </>
                            )}
                            <Card
                              title={`${userData?.character.Class_Name} (Lv. ${userData?.character.Value_Level})`}
                              variant="borderless"
                              style={{
                                width: "100%",
                                backgroundColor: "rgba(255, 255, 255, 0.5)"
                              }}
                            >
                              <p style={{ height: "5px" }}><strong style={{ color: "darkred" }}>💥 Damage: {charactersDamage ?? 0}</strong></p>
                              <p style={{ height: "5px" }}><strong style={{ color: "red" }}>❤️️ Health: {charactersHP ?? 0}/{charactersMaxHP ?? 0}</strong></p>
                              <p style={{ height: "5px" }}><strong style={{ color: "green" }}>🛡️ Defense: {charactersDefense}</strong></p>
                              <p style={{ height: "5px" }}><strong style={{ color: "purple" }}>🌀 Skill Damage: x{Number(1 + (charactersBonusSkill / 100)).toFixed(2)}</strong></p>
                            </Card>
                          </div>
                        ) : (
                          ""
                        )}
                      </div>
                    ) : i === 2 ? (
                      <div className="battle-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", height: "100vh", color: "white", textAlign: "center", padding: "20px" }}>
                        {currentEffect == "NONE" ? ("") : (
                          <div>
                            <h3 style={{ fontSize: "24px", color: "black" }}>{currentEffect}</h3>
                            <img
                              src={`/Effects/${currentEffect}.png`}
                              style={{
                                width: "200px", height: "200px",
                                objectFit: "cover", borderRadius: "10px",
                                marginBottom: "10px"
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ) : i === 3 ? (
                      <div className="battle-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", height: "100vh", color: "white", textAlign: "center", padding: "20px" }}>
                        {monsterList.length > 0 && (!isEnded || charactersHP <= 0) ? (
                          <div style={{ textAlign: "center" }}>
                            {isMonsterDefeated ? (
                              <h3 style={{ fontSize: "24px", color: "black" }}>Monster Defeated! Prepare for next wave!</h3>
                            ) : (
                              <>
                                <h2 style={{ fontSize: "24px", color: "black" }}>{monsterList[currentMonsterIndex].name}</h2>
                                <img
                                  className={isMonsterHit ? "monster-hit" : ""}
                                  src={`/Monster/${monsterList[currentMonsterIndex].id}.png`}
                                  style={{ width: "200px", height: "200px", objectFit: "cover", borderRadius: "10px", marginBottom: "10px", }}
                                />
                                <div className="progress" style={{ width: "300px", height: "18px", backgroundColor: "#333", borderRadius: "5px", margin: "10px auto", position: "relative" }}>
                                  <div className="progress-bar bg-danger"
                                    style={{
                                      width: `${(monsterHP / monsterList[currentMonsterIndex]?.health) * 100}%`,
                                      height: "100%",
                                      borderRadius: "5px"
                                    }}>
                                    <span style={{ fontSize: "14px", position: "absolute", width: "100%", textAlign: "center", fontWeight: "bold" }}>
                                      {monsterHP} / {monsterList[currentMonsterIndex]?.health}
                                    </span>
                                  </div>
                                </div>
                                <Card
                                  title={`${monsterList[currentMonsterIndex].name} (Lv. ${monsterList[currentMonsterIndex].level})`}
                                  variant="borderless"
                                  style={{
                                    width: "100%",
                                    height: "50",
                                    backgroundColor: "rgba(255, 255, 255, 0.5)"
                                  }}
                                >
                                  <p style={{ height: "5px" }}><strong style={{ color: "darkred" }}>💥 Damage: {monsterList[currentMonsterIndex]?.damage ?? 0}</strong></p>
                                  <p style={{ height: "5px" }}><strong style={{ color: "red" }}>❤️️ Health: {monsterHP ?? 0}/{monsterList[currentMonsterIndex]?.health ?? 0}</strong></p>
                                  <p style={{ height: "5px" }}><strong style={{ color: "green" }}>🛡️ Defense: {monsterList[currentMonsterIndex]?.defense ?? 0}</strong></p>
                                  <p style={{ height: "5px" }}><strong style={{ color: "black" }}>🔻 Effects:</strong></p>
                                  <div>
                                    {monsterEffect.map((effect, index) => (
                                      <p key={index}><strong>
                                        {effect.TYPE} ({effect.DAMAGE} DMG, {effect.DURATION} turns)
                                      </strong>
                                      </p>
                                    ))}
                                  </div>
                                </Card>
                              </>
                            )}
                          </div>
                        ) : (
                          ""
                        )}
                      </div>
                    ) : (
                      ""
                    )}
                  </div>
                ))}
              </Flex>
            </Flex>
          )}
        </div>
      </div>

      {/* End Modal */}
      <Modal show={showModalEnd} backdrop="static" keyboard={false} centered>
        <Modal.Header>
          <Modal.Title>Stage Completed!</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ textAlign: "center", justifyContent: "center" }}>
          <h4>--- Stage Rewards ---</h4>
          <h5>🪙 Coins: {dataRewardCoins}</h5>
          <h5>✨ XP: {dataRewardXP}</h5>
          <Button className="w-100" variant="primary" disabled={isClosing} onClick={() => handleReturn(instanceID)}>
            Claim and return
          </Button>
        </Modal.Body>
      </Modal>

      <Modal show={isLoading} backdrop="static" keyboard={false} centered>
        <Modal.Header>
          <Modal.Title>Please wait</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Loading...</p>
        </Modal.Body>
      </Modal>

      {/* Error Modal */}
      <Modal show={showModalErrorInstance} backdrop="static" keyboard={false} centered>
        <Modal.Header>
          <Modal.Title>Unknown Instance</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>You can't do this! Get out of here!</p>
          <Button className="w-100" variant="primary" onClick={() => router.push("/stagelist")}>
            Return
          </Button>
        </Modal.Body>
      </Modal>

      {/* Return Modal */}
      <Modal show={showModalReturn} onHide={() => setShowModalReturn(false)} centered>
        <Modal.Header>
          <Modal.Title>Are you sure?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex gap-2">
            <Button className="w-50" variant="secondary" disabled={isClosing} onClick={() => setShowModalReturn(false)}>
              Cancel
            </Button>
            <Button className="w-50" variant="danger" disabled={isClosing} onClick={() => handleReturn(instanceID)}>
              Return
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}
