# project

## File List

- Z-Runner\character.cpp
- Z-Runner\character.h
- Z-Runner\Enemy.cpp
- Z-Runner\Enemy.h
- Z-Runner\Game.cpp
- Z-Runner\Game.h
- Z-Runner\Object.cpp
- Z-Runner\Object.h
- Z-Runner\PathFinder.cpp
- Z-Runner\PathFinder.h
- Z-Runner\PathFindingNode.cpp
- Z-Runner\PathFindingNode.h
- Z-Runner\Platform.cpp
- Z-Runner\Platform.h
- Z-Runner\Player.cpp
- Z-Runner\Player.h
- Z-Runner\Projectile.cpp
- Z-Runner\Projectile.h
- Z-Runner\SceneGenerator.cpp
- Z-Runner\SceneGenerator.h
- Z-Runner\Z-Runner.cpp
- Z-Runner\Z-Runner.vcxproj
- Z-Runner\Z-Runner.vcxproj.filters
- Z-Runner\Z-Runner.vcxproj.user
- Z-Runner.sln

## File Contents

### Z-Runner\character.cpp
```
#include "Character.h"

void Character::refreshAttack()
{
	sleep(milliseconds(1000.f/attackRate));
	canAttack = true;
}

Vector2f Character::toVector2f(Vector2u vector)
{
	return Vector2f(vector.x, vector.y);
}

Texture* Character::getNextTexture(string textureName)
{
	try {
		textureIndex[textureName] = (textureIndex[textureName] + 1) % textures[textureName].size();
	}
	catch (exception e) {
		cout << e.what() << endl;
		textureIndex[textureName] = 0;
	}

	return textures[textureName][textureIndex[textureName]];
}

int Character::isCollidingWith(RectangleShape shape, bool selfCheck, FloatRect itemToCheck)
{
	FloatRect playerBounds = self.getGlobalBounds();
	FloatRect objectBounds = shape.getGlobalBounds();

	if (!selfCheck) {
		playerBounds = itemToCheck;
	}

	if (!playerBounds.intersects(objectBounds)) return -1;

	float playerRight = playerBounds.left + playerBounds.width;
	float playerBottom = playerBounds.top + playerBounds.height;
	float objectRight = objectBounds.left + objectBounds.width;
	float objectBottom = objectBounds.top + objectBounds.height;

	float overlapLeft = playerRight - objectBounds.left;
	float overlapRight = objectRight - playerBounds.left;
	float overlapTop = playerBottom - objectBounds.top;
	float overlapBottom = objectBottom - playerBounds.top;

	bool fromLeft = overlapLeft < overlapRight && overlapLeft < overlapTop && overlapLeft < overlapBottom;
	bool fromRight = overlapRight < overlapLeft && overlapRight < overlapTop && overlapRight < overlapBottom;
	bool fromTop = overlapTop < overlapBottom && overlapTop < overlapLeft && overlapTop < overlapRight;
	bool fromBottom = overlapBottom < overlapTop && overlapBottom < overlapLeft && overlapBottom < overlapRight;

	if (fromLeft) {
		return 3;
	}
	else if (fromRight) {
		return 1;
	}
	else if (fromTop) {
		return 0;
	}
	else if (fromBottom) {
		return 2;
	}
}

bool Character::isOnGround(RectangleShape shape)
{
	RectangleShape groundChecker;
	groundChecker.setSize(Vector2f(size.x * 0.9, 10));
	groundChecker.setPosition(self.getPosition().x + size.x * 0.05, self.getPosition().y + size.y - 10);

	return groundChecker.getGlobalBounds().intersects(shape.getGlobalBounds());
}

void Character::updatePosition(Vector2f position)
{
	self.setPosition(position);
}

void Character::updateSize(Vector2f size)
{
	self.setScale(vectorDivide(size, toVector2f(self.getTexture()->getSize())));
}

void Character::receiveDamage(float damage)
{
	health -= damage;
	died = health <= 0;
}

void Character::setVelocity(Vector2f velocity)
{
	if (!isFalling && velocity.y > 0) {
		velocity.y = 0;
		this->velocity.y = 0;
	}
	this->velocity = velocity;
}

void Character::addVelocity(Vector2f velocity)
{
	if (!isFalling && velocity.y > 0) {
		velocity.y = 0;
		this->velocity.y = 0;
	}
	this->velocity += velocity;
}

Vector2f Character::getSize()
{
	return size;
}

Vector2f Character::getPosition()
{
	return self.getPosition();
}

Vector2f Character::getVelocity()
{
	return velocity;
}

```

### Z-Runner\character.h
```
#pragma once

#include <SFML/Graphics/RectangleShape.hpp>
#include<SFML/System/Thread.hpp>
#include<SFML/System/Sleep.hpp>

#include "Object.h"

#include<unordered_map>;
#include <vector>

class Character : public Object
{
protected:
	int attackRate;

	Vector2f velocity;
	vector<RectangleShape> gunShots;
	void refreshAttack();
	Vector2f size;

	unordered_map<string, vector<Texture*>> textures;

	float health = 20;

	Thread* attackingTimer;

	template <typename T>

	T vectorDivide(T x, T y) {
		return Vector2f(x.x / y.x, x.y / y.y);
	}

	Vector2f toVector2f(Vector2u vector);

	unordered_map<string, int> textureIndex;

	Texture* getNextTexture(string textureName);

public :
	bool isFalling = true;
	bool canAttack = true;
	bool died = false;

	int isCollidingWith(RectangleShape shape, bool selfCheck, FloatRect itemToCheck = FloatRect());
	bool isOnGround(RectangleShape shape);

	void updatePosition(Vector2f position);
	void updateSize(Vector2f size);

	void receiveDamage(float damage);

	void setVelocity(Vector2f velocity);
	void addVelocity(Vector2f velocity);

	Vector2f getSize();
	Vector2f getPosition();
	Vector2f getVelocity();
};


```

### Z-Runner\Enemy.cpp
```
#include "Enemy.h"

void Enemy::trueUpdate(float deltaTime, vector<Platform> platforms, vector<Projectile*> projectiles,FloatRect playerBounds,FloatRect ground,PathFinder pathFinder)
{
	readyToUpdate = false;

	/*PathFindingNode startNode(0, 900, true);
	PathFindingNode targetNode(100, 900, true);

	std::vector<PathFindingNode*> path = pathFinder.findPath(startNode,targetNode,enemy.getSize().x,enemy.getSize().y,10,2,10000);
	for (int i = 0; i < 10; i++) {

		enemy.setPosition(path[i]->x,path[i]->y);
		cout << enemy.getPosition().x << " x " << enemy.getPosition().x<<endl;
	}*/

	if (canSeePlayer && !isFalling) {
		setVelocity(Vector2f(70 * (playerBounds.getPosition().x - self.getPosition().x > 0 ? 1.f : -1.f), velocity.y));
	}

	isFalling = !self.getGlobalBounds().intersects(ground);
	for (Platform platform : platforms) {
		int collidingSide = isCollidingWith(platform.getObject(),true);

		isFalling = isFalling && collidingSide != 0;

		if (collidingSide == 0) continue;

		if (collidingSide == 1) {
			setVelocity(Vector2f(velocity.x < 0 ? 0 : velocity.x, velocity.y));
			if(!isFalling) addVelocity(Vector2f(0, -50));
		}
		else if (collidingSide == 3) {
			setVelocity(Vector2f(velocity.x > 0 ? 0 : velocity.x, velocity.y));
			if (!isFalling) addVelocity(Vector2f(0, -100));
		}
		else if (collidingSide == 2 && !platform.ispassThrough) {
			setVelocity(Vector2f(velocity.x, velocity.y < 0 ? 0 : velocity.y));
		}
	}

	for (Projectile* projectile : projectiles) {
		if (projectile->isHostile) continue;

		if(self.getGlobalBounds().intersects(projectile->getObject().getGlobalBounds()) && !projectile->destroyed) {
			receiveDamage(projectile->getDamage());
			projectile->destruct();
		}
	}

	if (self.getGlobalBounds().intersects(playerBounds)) {
		velocity.x = 0;
	}

	if (isFalling) {
		addVelocity(Vector2f(0, 50) * deltaTime);
		setVelocity(Vector2f(0, velocity.y));
	}

	if (!isFalling && getVelocity().y > 0) {
		setVelocity(Vector2f(getVelocity().x, 0));
	}

	Vector2f newPosition = getPosition() + velocity * deltaTime;
	FloatRect afterMovement(Vector2f(newPosition), getSize());
	for (Platform platform : platforms) {
		int collidingSide = isCollidingWith(platform.getObject(), false,FloatRect(newPosition,getSize()));

		if (collidingSide == 1) {
			newPosition.x = platform.getObject().getSize().x + platform.getObject().getPosition().x;
		}
		else if (collidingSide == 3) {
			newPosition.x = platform.getObject().getPosition().x-getSize().x;
		}
		else if (collidingSide == 2 && !platform.ispassThrough) {
			newPosition.y= platform.getObject().getSize().y + platform.getObject().getPosition().y;
		}
		else if (collidingSide == 0) {
			newPosition.y = platform.getObject().getPosition().y-getSize().y;
		}
	}

	updatePosition(getPosition() + velocity * deltaTime);


	if (velocity.x != 0) {
		self.setTexture(*getNextTexture("move"),true);
		updateSize(size);
		self.setScale(-self.getScale().x*velocity.x / abs(velocity.x), self.getScale().y);
	}

	readyToUpdate = true;

}


Enemy::Enemy(float width, float x, float y, unordered_map<string, vector<Texture*>> &texture)
{
	self.setPosition(x, y);

	this->textures = texture;
	self.setTexture(*texture["idle"][0]);
	
	size = Vector2f(width, width);
	updateSize(size);

	attackingTimer = nullptr;
	updateThread = nullptr;
	attackRate = 2;
}

int Enemy::attackPlayer()
{
	if (!canAttack) return 0;
	delete attackingTimer;
	canAttack = false;
	attackingTimer = new Thread(bind( & Enemy::refreshAttack, this));
	attackingTimer->launch();
	return ATTACK_POWER;
}

void Enemy::update(float deltaTime, vector<Platform> platforms, vector<Projectile*> projectiles, FloatRect playerBounds,FloatRect ground,PathFinder pathFinder)
{
	if (died || !readyToUpdate) return;
	
	//trueUpdate(deltaTime, platforms, projectiles, playerBounds);
	delete updateThread;
	updateThread = new Thread(bind(&Enemy::trueUpdate, this, deltaTime, platforms, projectiles, playerBounds,ground, pathFinder));
	updateThread->launch();
}
```

### Z-Runner\Enemy.h
```
#pragma once

#define ATTACK_POWER 5

#include<iostream>
#include <functional>

#include "Platform.h"
#include "Projectile.h"

#include "PathFinder.h"
#include "PathFindingNode.h"

#include "Character.h"

class Enemy : public Character
{
private:
	void trueUpdate(float deltaTime, vector<Platform> platforms, vector<Projectile*> projectiles, FloatRect playerBounds, FloatRect ground,PathFinder pathFinder);
	
	Thread* updateThread;

	bool readyToUpdate = true;

public:
	bool canSeePlayer = false;

	Enemy(float width, float x, float y, unordered_map<string, vector<Texture*>> &texture);

	int attackPlayer();

	void update(float deltaTime,vector<Platform> platforms,vector<Projectile*> projectiles, FloatRect playerBounds, FloatRect ground,PathFinder pathFinder);

};


```

### Z-Runner\Game.cpp
```
#include "Game.h"
#include <iostream>
#include <filesystem>

void Game::initializeVariables()
{
	this->window = nullptr;

    //Loading texture
    path ResFolder = current_path() / "res\\textures\\sprites";

    for (const auto& character : directory_iterator(ResFolder)) {
        unordered_map<string, vector<Texture*>>* textureGroup = new unordered_map<string, vector<Texture*>>();
        for (const auto& animation : directory_iterator(character.path())) {
            vector<Texture*>* textures = new vector<Texture*>();
            for (const auto& file : directory_iterator(animation.path())) {
                Texture* texture = new Texture();
                texture->loadFromFile("res\\textures\\sprites\\"+relative(file,ResFolder).string());
                textures->push_back(texture);
            }
            (*textureGroup)[animation.path().filename().string()] = *textures;
        }
        Textures[character.path().filename().string()] = *textureGroup;
    }
}

void Game::initializeWindow()
{
	videoMode.width = SCREEN_WIDTH;//1920
	videoMode.height = SCREEN_HEIGHT;//1080

	window=new RenderWindow(videoMode, "Z-Runner", Style::Titlebar | Style::Close);

    window->setFramerateLimit(30);

    window->setKeyRepeatEnabled(false);

    deltaTime = clock.restart();
}

Game::Game() : mainCamera(FloatRect(0.f, SCREEN_HEIGHT-VIEW_HEIGHT, VIEW_WIDTH, VIEW_HEIGHT)),sceneGenerator(nextSceneObjects, SCREEN_HEIGHT * 0.9f,SCREEN_WIDTH,SCREEN_HEIGHT), grid(SCREEN_WIDTH, vector<PathFindingNode>(SCREEN_HEIGHT, PathFindingNode(0, 0, true))), pathFinder(SCREEN_WIDTH, SCREEN_HEIGHT)
{
	this->initializeVariables();
	this->initializeWindow();

    ground.initialize(SCREEN_WIDTH, SCREEN_HEIGHT * 0.1f,0,SCREEN_HEIGHT*0.9f, Color(99, 86, 49,0),true);
    player.initialize(SCREEN_WIDTH/56, SCREEN_WIDTH / 56, SCREEN_WIDTH / 37, ground.getPosition().y - SCREEN_WIDTH / 56, Textures["player"]);

    Platform safeZoneBarrier;
    safeZoneBarrier.initialize(200, 100, VIEW_WIDTH - 200, ground.getPosition().y - 100, Color::Red, false);

    window->setView(mainCamera);

    gameObjects.Platforms.push_back(safeZoneBarrier);
    gameObjects.Enemies.push_back(new Enemy( 50, VIEW_WIDTH - 300, ground.getPosition().y - 150, Textures["zombie"]));

    
    /*for (int x = 0; x < SCREEN_WIDTH; x++) {
        for (int y = 0; y < SCREEN_HEIGHT; y++) {
            grid[x][y] = PathFindingNode(x, y, true); // Initialize each node as walkable
        }
    }

    // Adjust walkable nodes based on intersections with platforms and obstacles
    for (auto& row : grid) {
        for (auto& node : row) {
            sf::FloatRect nodeRect(static_cast<float>(node.x), static_cast<float>(node.y), 1.0f, 1.0f); // Create SFML FloatRect for current node

            // Check intersections with platforms
            for (Platform& platform : gameObjects.Platforms) {
                if (platform.getObject().getGlobalBounds().intersects(nodeRect)) {
                    node.walkable = false;
                    break; // No need to check other platforms if already not walkable
                }
            }

            // Check intersections with obstacles (assuming Obstacle is similar to Platform)
            if (!node.walkable) continue; // Skip obstacle check if node is already not walkable
            for (Obstacle& obstacle : gameObjects.Obstacles) {
                if (obstacle.getObject().getGlobalBounds().intersects(nodeRect)) {
                    node.walkable = false;
                    break; // No need to check other obstacles if already not walkable
                }
            }
        }
    }

    pathFinder.setGrid(grid);*/


    sceneGenerator.setTextures(Textures);
    sceneGenerator.generateNextScene();
}

Game::~Game()
{
	delete window;
}

void Game::eventHandler()
{
    while (window->pollEvent(event)) {
        switch (event.type) {

        case Event::Closed:
            window->close();
            break;
        case Event::KeyPressed:
            switch (event.key.code) {
            case Keyboard::Escape:
                window->close();
                break;
            case Keyboard::A:
                pressedKey = event.key.code;
                break;
            case Keyboard::D:
                pressedKey = event.key.code;
                break;
            case Keyboard::Space:
                if (!player.isFalling) {
                    player.addVelocity(Vector2f(0,-JUMP_HEIGHT));
                }
            }
            break;
        case Event::KeyReleased:
            switch (event.key.code) {
            case Keyboard::A:
                pressedKey = -1;
                break;
            case Keyboard::D:
                pressedKey = -1;
                break;
            }
            break;

        }
    }

}

void Game::update()
{
    vector<RectangleShape> objects;

    Vector2f mousePos = window->mapPixelToCoords(Mouse::getPosition(*window));
    deltaTime = clock.restart();

    eventHandler();

    if (pressedKey == Keyboard::A) {
        player.addVelocity(Vector2f(-MOVEMENT_SPEED, 0));
    }
    else if (pressedKey==Keyboard::D) {
        player.addVelocity(Vector2f(MOVEMENT_SPEED, 0));

   }

    //Player on ground check
    player.isFalling = player.isCollidingWith(ground.getObject(),true)!=0;
    for (Platform platform : gameObjects.Platforms) {
        int collidingSide = player.isCollidingWith(platform.getObject(),true);
        objects.push_back(platform.getObject());

        player.isFalling = player.isFalling && collidingSide!=0;

        if (collidingSide==0) continue;

        if (collidingSide == 1) {
            player.setVelocity(Vector2f(player.getVelocity().x < 0 ? 0 : player.getVelocity().x, player.getVelocity().y));
        }
        else if (collidingSide == 3) {
            player.setVelocity(Vector2f(player.getVelocity().x > 0 ? 0 : player.getVelocity().x, player.getVelocity().y));
        }
        else if (collidingSide == 2 && !platform.ispassThrough) {
            player.setVelocity(Vector2f(player.getVelocity().x, player.getVelocity().y < 0 ? 0 : player.getVelocity().y));
        }

    }

    if (!player.isFalling && player.getVelocity().y > 0) {
        player.setVelocity(Vector2f(player.getVelocity().x, 0));
    }

    //gravity
    if (player.isFalling) {
        player.addVelocity(Vector2f(0, GRAVITY)*deltaTime.asSeconds());
    }

    //friction
    if (player.getVelocity().x != 0) {
        float friction = -player.getVelocity().x*0.4;
        friction = abs(friction) < 0.1 ? -player.getVelocity().x: friction;
        player.addVelocity(Vector2f(friction, 0));
    }

    //Player shooting
    if (player.canAttack && !player.died) {
        if (gameObjects.Projectiles.size() > 10) {
            Projectile* t;
            t = gameObjects.Projectiles.back();
            gameObjects.Projectiles.pop_back();
            delete t;
        }

        gameObjects.Projectiles.insert(gameObjects.Projectiles.begin(), player.shootAt(mousePos));
    }

    objects.push_back(ground.getObject());

    //Updating projectiles
    for (Projectile* p : gameObjects.Projectiles) {
        if (p->destroyed) {
            continue;
        }
        
        p->update(deltaTime.asSeconds(),objects);
    }

    //Updating Enemies
    for (Enemy* e : gameObjects.Enemies) {
        if (e->died) {
            continue;
        }

        if (e->getObject().getGlobalBounds().intersects(player.getObject().getGlobalBounds())) {
            player.receiveDamage(e->attackPlayer());
        }

        e->canSeePlayer = FloatRect(mainCamera.getCenter() - mainCamera.getSize() / 2.f, mainCamera.getSize()).intersects(e->getObject().getGlobalBounds());

        e->update(deltaTime.asSeconds(),gameObjects.Platforms,gameObjects.Projectiles,player.getObject().getGlobalBounds(),ground.getObject().getGlobalBounds(),pathFinder);

    }
    //Player died
    if (player.died) {
        player.setVelocity(Vector2f(0, player.getVelocity().y));
        //player.setColor(Color::White);
    }

    player.updatePosition(player.getPosition() + player.getVelocity()*deltaTime.asSeconds());

    //camera movements
    if (player.getPosition().x >= mainCamera.getCenter().x && player.getVelocity().x > 0) {
        if (mainCamera.getCenter().x < SCREEN_WIDTH - VIEW_WIDTH / 2) {
            mainCamera.move(Vector2f(player.getVelocity().x * deltaTime.asSeconds(), 0));
        }
    }
    else if (player.getPosition().x <= mainCamera.getCenter().x && player.getVelocity().x < 0) {
        if (mainCamera.getCenter().x > VIEW_WIDTH / 2) {
            mainCamera.move(Vector2f(player.getVelocity().x * deltaTime.asSeconds(), 0));
        }
    }

    if (player.getPosition().x >= SCREEN_WIDTH * 0.9) {
        player.updatePosition(Vector2f(SCREEN_WIDTH / 37, ground.getPosition().y - SCREEN_WIDTH / 56));
        player.setVelocity(Vector2f(0, 0));
        mainCamera.reset(FloatRect(0.f, SCREEN_HEIGHT - VIEW_HEIGHT, VIEW_WIDTH, VIEW_HEIGHT));
        if (gameObjects.id != nextSceneObjects.id) {
            gameObjects = nextSceneObjects;
            sceneGenerator.generateNextScene();
        }
        /*if (!isInSceneTransition) {
            cout << "Starting scene Generation" << endl;
            isInSceneTransition = true;
        }else if (!sceneGenerator.isGeneratingScene) {
            cout << "Finished scene Generation" << endl;
            
            isInSceneTransition = false;
        } */
    }

}

void Game::render()
{
    window->clear();
 
    window->draw(ground.getObject());
    window->draw(player.getObject());

    for (Platform p : gameObjects.Platforms) {
        window->draw(p.getObject());
    }

    for (Projectile* p : gameObjects.Projectiles) {
        if (p->destroyed) continue;
        window->draw(p->getObject());
    }
    for (Enemy* e : gameObjects.Enemies) {
        if (e->died) continue;
        window->draw(e->getObject());
    }

    window->setView(mainCamera);

    window->display();
}

bool Game::isRunning()
{
	return this->window->isOpen();
}

```

### Z-Runner\Game.h
```
#pragma once

#define SCREEN_WIDTH 1920.f
#define SCREEN_HEIGHT 1080.f

#define GRAVITY 50

#define VIEW_WIDTH 960.f
#define VIEW_HEIGHT 540.f

#include <SFML/Graphics.hpp>
#include <SFML/Audio.hpp>
#include <SFML/Window.hpp>
#include <SFML/System.hpp>
#include <SFML/Network.hpp>

#include <vector>
#include <unordered_map>
#include <filesystem>

#include "Enemy.h"
#include "Platform.h"
#include "Player.h"
#include "Projectile.h"

#include "SceneGenerator.h"

#include "PathFinder.h"
#include <filesystem>

using namespace sf;
using namespace std;
using namespace filesystem;

//typedef struct GameObjects {
//	vector<Enemy> Enemies;
//	vector<Obstacle> Obstacles; 
//	vector<Platform> Platforms;
//	vector<Projectile*> Projectiles;
//} GameObjects;

class Game
{

private :
	RenderWindow* window;
	VideoMode videoMode;
	Event event;
	int pressedKey = -1;
	Clock clock;
	Time deltaTime;

	Player player;
	Platform ground;
	GameObjects gameObjects;
	unordered_map<string,unordered_map<string,vector<Texture*>>> Textures;

	SceneGenerator sceneGenerator;

	bool isInSceneTransition=false;

	View mainCamera;

	void loadTexture();

	void initializeVariables();
	void initializeWindow();

	vector<vector<PathFindingNode>> grid;
	PathFinder pathFinder;
public :
	GameObjects nextSceneObjects;
	Game();
	virtual ~Game();

	void eventHandler();
	void update();
	void render();

	bool isRunning();

	friend class SceneGenerator;
};


```

### Z-Runner\Object.cpp
```
#include "Object.h"

Sprite Object::getObject()
{
    return self;
}

```

### Z-Runner\Object.h
```
#pragma once

#include <SFML/Graphics/Sprite.hpp>
#include <SFML/Graphics/Texture.hpp>

#include <iostream>

using namespace std;
using namespace sf;

class Object
{
protected:
	Sprite self;
public:
	Sprite getObject();
};


```

### Z-Runner\PathFinder.cpp
```
#include "PathFinder.h"
#include <algorithm> // for min_element, remove
#include <cmath> // for abs

float PathFinder::heuristic(const PathFindingNode& a, const PathFindingNode& b)
{
    return std::abs(a.x - b.x) + std::abs(a.y - b.y); // Manhattan distance
}

bool PathFinder::canMoveToPosition(int x, int y, int enemyWidth, int enemyHeight)
{
    for (int i = 0; i < enemyWidth; ++i) {
        for (int j = 0; j < enemyHeight; ++j) {
            int checkX = x + i;
            int checkY = y + j;
            if (checkX < 0 || checkX >= screenHeight || checkY < 0 || checkY >= screenHeight || !grid[checkX][checkY].walkable) {
                return false;
            }
        }
    }
    return true;
}

PathFinder::PathFinder(int screenWidth, int screenHeight)
{
    this->screenWidth = screenWidth;
    this->screenHeight = screenHeight; // Fixed assignment for screenHeight
}

std::vector<PathFindingNode*> PathFinder::findPath(PathFindingNode& startNode, PathFindingNode& targetNode, int enemyWidth, int enemyHeight, int jumpHeight, int jumpWidth, int fallDistance)
{
    std::vector<PathFindingNode*> openSet;
    std::vector<PathFindingNode*> closedSet;

    openSet.push_back(&startNode);

    while (!openSet.empty()) {
        auto currentNode = *std::min_element(openSet.begin(), openSet.end(), [](PathFindingNode* a, PathFindingNode* b) { return a->getFCost() < b->getFCost(); });

        if (*currentNode == targetNode) {
            std::vector<PathFindingNode*> path;
            while (currentNode != &startNode) {
                path.push_back(currentNode);
                currentNode = currentNode->parent;
            }
            std::reverse(path.begin(), path.end());
            return path;
        }

        openSet.erase(std::remove(openSet.begin(), openSet.end(), currentNode), openSet.end());
        closedSet.push_back(currentNode);

        std::vector<PathFindingNode*> neighbors;

        // Check left and right movements
        if (currentNode->x > 0 && canMoveToPosition(currentNode->x - 1, currentNode->y, enemyWidth, enemyHeight)) neighbors.push_back(&grid[currentNode->x - 1][currentNode->y]); // Left
        if (currentNode->x < screenWidth - 1 && canMoveToPosition(currentNode->x + 1, currentNode->y, enemyWidth, enemyHeight)) neighbors.push_back(&grid[currentNode->x + 1][currentNode->y]); // Right

        // Check for jumps within the max jump height and width
        for (int dx = -jumpWidth; dx <= jumpWidth; dx++) {
            for (int dy = 1; dy <= jumpHeight; dy++) {
                int nx = currentNode->x + dx;
                int ny = currentNode->y - dy; // Adjust y-axis for SFML coordinate system (decrement)
                if (nx >= 0 && nx < screenWidth && ny >= 0 && ny < screenHeight && canMoveToPosition(nx, ny, enemyWidth, enemyHeight)) {
                    neighbors.push_back(&grid[nx][ny]); // Jump
                }
            }
        }

        // Check for falls within the max fall distance
        for (int dy = 1; dy <= fallDistance; dy++) {
            int ny = currentNode->y + dy;
            if (ny < screenHeight && canMoveToPosition(currentNode->x, ny, enemyWidth, enemyHeight)) {
                neighbors.push_back(&grid[currentNode->x][ny]); // Fall
            }
        }

        for (auto neighbor : neighbors) {
            if (!neighbor->walkable || std::find(closedSet.begin(), closedSet.end(), neighbor) != closedSet.end()) continue;

            float newGCost = currentNode->gCost + heuristic(*currentNode, *neighbor);
            if (newGCost < neighbor->gCost || std::find(openSet.begin(), openSet.end(), neighbor) == openSet.end()) {
                neighbor->gCost = newGCost;
                neighbor->hCost = heuristic(*neighbor, targetNode);
                neighbor->parent = currentNode;

                if (std::find(openSet.begin(), openSet.end(), neighbor) == openSet.end()) {
                    openSet.push_back(neighbor);
                }
            }
        }
    }

    return std::vector<PathFindingNode*>(); // Return an empty path if no path is found
}

void PathFinder::setGrid(std::vector<std::vector<PathFindingNode>>& grid)
{
    this->grid = grid;
}

```

### Z-Runner\PathFinder.h
```
#pragma once

#include <vector>
#include <algorithm>
#include <iostream>
#include "PathFindingNode.h"

using namespace std;
class PathFinder
{
private:
	int screenWidth;
	int screenHeight;
	vector<vector<PathFindingNode>> grid;

	float heuristic(const PathFindingNode& a, const PathFindingNode& b);
	bool canMoveToPosition(int x, int y, int enemyWidth, int enemyHeight);
public:
	PathFinder(int screenWidth,int screenHeight);

	vector<PathFindingNode*> findPath(PathFindingNode& startNode, PathFindingNode& targetNode, int enemyWidth, int enemyHeight, int jumpHeight, int jumpWidth, int fallDistance);

	void setGrid(vector<vector<PathFindingNode>>& grid);
};


```

### Z-Runner\PathFindingNode.cpp
```
#include "PathFindingNode.h"

PathFindingNode::PathFindingNode(int x, int y, bool walkable) : x(x), y(y), walkable(walkable), gCost(0), hCost(0), parent(nullptr) {}


float PathFindingNode::getFCost() const
{
    return gCost + hCost;
}

bool PathFindingNode::operator==(const PathFindingNode& other) const
{
	return x == other.x && y == other.y;
}

```

### Z-Runner\PathFindingNode.h
```
#pragma once
class PathFindingNode
{
public :
    int x, y;
    bool walkable;
    float gCost, hCost;
    PathFindingNode* parent;

    PathFindingNode(int x, int y, bool walkable);

    float getFCost() const;

    bool operator==(const PathFindingNode& other) const;
};


```

### Z-Runner\Platform.cpp
```
#include "Platform.h"
Platform::Platform()
{
}
void Platform::initialize(float width,float height,float x,float y,Color color,bool isPassThrough)
{
	shape.setFillColor(color);
	shape.setSize(Vector2f(width, height));
	shape.setPosition(x, y);
	shape.setOutlineColor(Color::Transparent);
	shape.setOutlineThickness(1.f);
	shape.setOutlineColor(Color::Transparent);

	this->ispassThrough = isPassThrough;
}

void Platform::updateColor(Color color)
{
}

void Platform::updateSize(int width, int height)
{
}

void Platform::updatePosition(float x, float y) {
	shape.setPosition(x, y);
}
Vector2f Platform::getPosition()
{
	return shape.getPosition();
}
RectangleShape Platform::getBoundaryObject() {
	return bounds;
}
RectangleShape Platform::getObject()
{
	return shape;
}

```

### Z-Runner\Platform.h
```
#pragma once

#include <SFML/Graphics/RectangleShape.hpp>

using namespace sf;

class Platform
{
private:
	RectangleShape shape,bounds;

public :
	bool ispassThrough;

	Platform();
	void initialize(float width,float height,float x,float y, Color color,bool isPassThrough);

	void updateColor(Color color);
	void updateSize(int width, int height);
	void updatePosition(float x, float y);

	Vector2f getPosition();
	RectangleShape getObject();
	RectangleShape getBoundaryObject();
};


```

### Z-Runner\Player.cpp
```
#include "Player.h"

Player::Player()
{
	attackingTimer = nullptr;
}

void Player::initialize(float width, float height, float x, float y, unordered_map<string, vector<Texture*>>& texture)
{
	self.setPosition(x, y);

	this->textures = texture;
	self.setTexture(*texture["idle"][0]);

	size = Vector2f(width, height);
	updateSize(size);

	attackingTimer = nullptr;
	attackRate = 2;
}


Projectile* Player::shootAt(Vector2f target)
{
	delete attackingTimer;
	canAttack = false;
	attackingTimer =new Thread(bind( & Player::refreshAttack, this));
	attackingTimer->launch();

	target -= self.getPosition();
	target = target*(BULLET_SPEED/sqrtf(target.x * target.x + target.y * target.y)) ;
	return new Projectile(10, target, Vector2f(5, 2),self.getPosition(), Color::Yellow,false);
}

```

### Z-Runner\Player.h
```
#pragma once

#define BULLET_SPEED 250

#define MOVEMENT_SPEED 100
#define JUMP_HEIGHT 100

#include<iostream>
#include <functional>

#include "Projectile.h"

#include "Character.h"

class Player : public Character
{
private:
	vector<RectangleShape> gunShots;

public:

	Player();
	void initialize(float width, float height, float x, float y, unordered_map<string, vector<Texture*>>& texture);

	Projectile* shootAt(Vector2f target);

};


```

### Z-Runner\Projectile.cpp
```
#include "Projectile.h"

Projectile::Projectile(float damage, Vector2f velocity, Vector2f size,Vector2f init, Color color,bool isHostile)
{
	this->damage = damage;
	this->velocity = velocity;
	this->isHostile = isHostile;
	projectile.setSize(size);
	projectile.setFillColor(color);
	projectile.setPosition(init);

	updateThread = nullptr;
}

void Projectile::update(float deltaTime, vector<RectangleShape> shapes)
{
	if (destroyed) {
		return;
	}
	projectile.setPosition(projectile.getPosition()+velocity * deltaTime);
	projectile.setRotation(atan2f(velocity.y, velocity.x) * 57.3f);
	delete updateThread;
	updateThread = new Thread(bind(&Projectile::checkForCollision, this, shapes));
	updateThread->launch();
}
void Projectile::checkForCollision(vector<RectangleShape> shapes)
{
	for (const RectangleShape& shape : shapes) {
		float rect1[4] = { projectile.getPosition().x,projectile.getPosition().y,projectile.getSize().x,projectile.getSize().y };
		rect1[2] += rect1[0];
		rect1[3] += rect1[1];

		float rect2[4] = { shape.getPosition().x,shape.getPosition().y,shape.getSize().x,shape.getSize().y };
		rect1[2] += rect1[0];
		rect1[3] += rect1[1];
		if (projectile.getGlobalBounds().intersects(shape.getGlobalBounds()) || (rect1[0] > rect2[0] && rect1[0]<rect2[2] && rect1[1]>rect2[1] && rect1[1] < rect2[3])) {
			destruct();
		}
	}
	
}

void Projectile::destruct()
{
	destroyed = true;
	velocity=Vector2f(0,0);
}

float Projectile::getDamage()
{
	return damage;
}

RectangleShape Projectile::getObject()
{
	return projectile;
}

```

### Z-Runner\Projectile.h
```
#pragma once

#include <SFML/Graphics/RectangleShape.hpp>
#include <SFML/System/Thread.hpp>
#include <iostream>
#include <functional>
#include <vector>

using namespace sf;
using namespace std;

class Projectile
{
private:
	float damage;
	Vector2f velocity;
	RectangleShape projectile;
	Thread* updateThread;

public:
	Projectile(float damage, Vector2f velocity, Vector2f size,Vector2f init, Color color,bool isHostile);
	bool destroyed = false;
	bool isHostile = false;

	void update(float deltaTime , vector<RectangleShape> shapes);
	void checkForCollision(vector<RectangleShape> shapes);
	
	void destruct();
	float getDamage();

	RectangleShape getObject();
};


```

### Z-Runner\SceneGenerator.cpp
```
#include "SceneGenerator.h"

void SceneGenerator::generateScene()
{
	isGeneratingScene = true;

	srand(time(NULL));
	SceneTypes sceneType = static_cast<SceneTypes>(rand() % END);

	if (sceneType == Plain||true) {
		for (int i = 0; i < (10 + rand() % 5); i++) {
			gameObjects.Enemies.push_back(new Enemy(50,  fmod(rand(), (screenWidth * 0.8)) + screenWidth * 0.1, baseLine-20, Textures["zombie"]));
		}
	}
	else if (sceneType == Normal) {

	}

	gameObjects.id = gameObjects.id + 1;

	isGeneratingScene = false;
}

SceneGenerator::SceneGenerator(GameObjects& gameObjects,int baseLine, float screenWidth, float screenHeight):gameObjects(gameObjects)
{
	this->baseLine = baseLine;
	this -> screenWidth = screenWidth;
	this -> screenHeight = screenHeight;


	generatorThread = nullptr;
}

void SceneGenerator::setTextures(unordered_map<string, unordered_map<string, vector<Texture*>>>& textures)
{
	this->Textures = textures;
}

void SceneGenerator::generateNextScene()
{
	if (isGeneratingScene) return;
	delete generatorThread;
	generatorThread = new Thread(&SceneGenerator::generateScene, this);
	generatorThread->launch();
}



```

### Z-Runner\SceneGenerator.h
```
#pragma once

#include <stdlib.h>
#include <time.h>
#include <vector>

#include <SFML/System/Thread.hpp>

#include "Enemy.h"
#include "Platform.h"
#include "Player.h"
#include "Projectile.h"

using namespace std;

enum SceneTypes {
	Normal,
	Parkour,
	ParkourWithZombies,
	Plain,
	BossArena,
	END
};

typedef struct GameObjects {
	vector<Enemy*> Enemies;
	vector<Platform> Platforms;
	vector<Projectile*> Projectiles;
	int id=0;
} GameObjects;
		
class SceneGenerator
{
private :

	Thread* generatorThread;
	unordered_map<string, unordered_map<string, vector<Texture*>>> Textures;

	int baseLine;
	float screenWidth;
	float screenHeight;

	void generateScene();
public :
	GameObjects& gameObjects;
	bool isGeneratingScene;
	SceneGenerator(GameObjects& gameObjects, int baseLine, float screenWidth, float screenHeight);
	void setTextures(unordered_map<string, unordered_map<string, vector<Texture*>>>& textures);
	void generateNextScene();
};


```

### Z-Runner\Z-Runner.cpp
```
#include <iostream>
#include "Game.h"

using namespace sf;

int main()
{
    Game game;

    while (game.isRunning()) {
        game.update();
        game.render();
    }
    return 0;
}

```

### Z-Runner\Z-Runner.vcxproj
```
<?xml version="1.0" encoding="utf-8"?>
<Project DefaultTargets="Build" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
  <ItemGroup Label="ProjectConfigurations">
    <ProjectConfiguration Include="Debug|Win32">
      <Configuration>Debug</Configuration>
      <Platform>Win32</Platform>
    </ProjectConfiguration>
    <ProjectConfiguration Include="Release|Win32">
      <Configuration>Release</Configuration>
      <Platform>Win32</Platform>
    </ProjectConfiguration>
    <ProjectConfiguration Include="Debug|x64">
      <Configuration>Debug</Configuration>
      <Platform>x64</Platform>
    </ProjectConfiguration>
    <ProjectConfiguration Include="Release|x64">
      <Configuration>Release</Configuration>
      <Platform>x64</Platform>
    </ProjectConfiguration>
  </ItemGroup>
  <PropertyGroup Label="Globals">
    <VCProjectVersion>17.0</VCProjectVersion>
    <Keyword>Win32Proj</Keyword>
    <ProjectGuid>{01e5ab7e-5623-4563-b714-406831ea844d}</ProjectGuid>
    <RootNamespace>ZRunner</RootNamespace>
    <WindowsTargetPlatformVersion>10.0</WindowsTargetPlatformVersion>
  </PropertyGroup>
  <Import Project="$(VCTargetsPath)\Microsoft.Cpp.Default.props" />
  <PropertyGroup Condition="'$(Configuration)|$(Platform)'=='Debug|Win32'" Label="Configuration">
    <ConfigurationType>Application</ConfigurationType>
    <UseDebugLibraries>true</UseDebugLibraries>
    <PlatformToolset>v143</PlatformToolset>
    <CharacterSet>Unicode</CharacterSet>
  </PropertyGroup>
  <PropertyGroup Condition="'$(Configuration)|$(Platform)'=='Release|Win32'" Label="Configuration">
    <ConfigurationType>Application</ConfigurationType>
    <UseDebugLibraries>false</UseDebugLibraries>
    <PlatformToolset>v143</PlatformToolset>
    <WholeProgramOptimization>true</WholeProgramOptimization>
    <CharacterSet>Unicode</CharacterSet>
  </PropertyGroup>
  <PropertyGroup Condition="'$(Configuration)|$(Platform)'=='Debug|x64'" Label="Configuration">
    <ConfigurationType>Application</ConfigurationType>
    <UseDebugLibraries>true</UseDebugLibraries>
    <PlatformToolset>v143</PlatformToolset>
    <CharacterSet>Unicode</CharacterSet>
  </PropertyGroup>
  <PropertyGroup Condition="'$(Configuration)|$(Platform)'=='Release|x64'" Label="Configuration">
    <ConfigurationType>Application</ConfigurationType>
    <UseDebugLibraries>false</UseDebugLibraries>
    <PlatformToolset>v143</PlatformToolset>
    <WholeProgramOptimization>true</WholeProgramOptimization>
    <CharacterSet>Unicode</CharacterSet>
  </PropertyGroup>
  <Import Project="$(VCTargetsPath)\Microsoft.Cpp.props" />
  <ImportGroup Label="ExtensionSettings">
  </ImportGroup>
  <ImportGroup Label="Shared">
  </ImportGroup>
  <ImportGroup Label="PropertySheets" Condition="'$(Configuration)|$(Platform)'=='Debug|Win32'">
    <Import Project="$(UserRootDir)\Microsoft.Cpp.$(Platform).user.props" Condition="exists('$(UserRootDir)\Microsoft.Cpp.$(Platform).user.props')" Label="LocalAppDataPlatform" />
  </ImportGroup>
  <ImportGroup Label="PropertySheets" Condition="'$(Configuration)|$(Platform)'=='Release|Win32'">
    <Import Project="$(UserRootDir)\Microsoft.Cpp.$(Platform).user.props" Condition="exists('$(UserRootDir)\Microsoft.Cpp.$(Platform).user.props')" Label="LocalAppDataPlatform" />
  </ImportGroup>
  <ImportGroup Label="PropertySheets" Condition="'$(Configuration)|$(Platform)'=='Debug|x64'">
    <Import Project="$(UserRootDir)\Microsoft.Cpp.$(Platform).user.props" Condition="exists('$(UserRootDir)\Microsoft.Cpp.$(Platform).user.props')" Label="LocalAppDataPlatform" />
  </ImportGroup>
  <ImportGroup Label="PropertySheets" Condition="'$(Configuration)|$(Platform)'=='Release|x64'">
    <Import Project="$(UserRootDir)\Microsoft.Cpp.$(Platform).user.props" Condition="exists('$(UserRootDir)\Microsoft.Cpp.$(Platform).user.props')" Label="LocalAppDataPlatform" />
  </ImportGroup>
  <PropertyGroup Label="UserMacros" />
  <ItemDefinitionGroup Condition="'$(Configuration)|$(Platform)'=='Debug|Win32'">
    <ClCompile>
      <WarningLevel>Level3</WarningLevel>
      <SDLCheck>true</SDLCheck>
      <PreprocessorDefinitions>WIN32;_DEBUG;_CONSOLE;%(PreprocessorDefinitions)</PreprocessorDefinitions>
      <ConformanceMode>true</ConformanceMode>
      <AdditionalIncludeDirectories>C:\Projects\S2_OOPs_Assignment\Z-Runner\External\include</AdditionalIncludeDirectories>
      <LanguageStandard>stdcpp17</LanguageStandard>
    </ClCompile>
    <Link>
      <SubSystem>Console</SubSystem>
      <GenerateDebugInformation>true</GenerateDebugInformation>
      <AdditionalLibraryDirectories>C:\Projects\S2_OOPs_Assignment\Z-Runner\External\lib;%(AdditionalLibraryDirectories)</AdditionalLibraryDirectories>
      <AdditionalDependencies>sfml-system-d.lib;sfml-graphics-d.lib;sfml-window-d.lib;sfml-audio-d.lib;sfml-network-d.lib;%(AdditionalDependencies)</AdditionalDependencies>
    </Link>
  </ItemDefinitionGroup>
  <ItemDefinitionGroup Condition="'$(Configuration)|$(Platform)'=='Release|Win32'">
    <ClCompile>
      <WarningLevel>Level3</WarningLevel>
      <FunctionLevelLinking>true</FunctionLevelLinking>
      <IntrinsicFunctions>true</IntrinsicFunctions>
      <SDLCheck>true</SDLCheck>
      <PreprocessorDefinitions>WIN32;NDEBUG;_CONSOLE;%(PreprocessorDefinitions)</PreprocessorDefinitions>
      <ConformanceMode>true</ConformanceMode>
      <AdditionalIncludeDirectories>C:\Projects\S2_OOPs_Assignment\Z-Runner\External\include</AdditionalIncludeDirectories>
      <LanguageStandard>stdcpp17</LanguageStandard>
    </ClCompile>
    <Link>
      <SubSystem>Console</SubSystem>
      <EnableCOMDATFolding>true</EnableCOMDATFolding>
      <OptimizeReferences>true</OptimizeReferences>
      <GenerateDebugInformation>true</GenerateDebugInformation>
      <AdditionalLibraryDirectories>C:\Projects\S2_OOPs_Assignment\Z-Runner\External\lib;%(AdditionalLibraryDirectories)</AdditionalLibraryDirectories>
      <AdditionalDependencies>sfml-system.lib;sfml-graphics.lib;sfml-window.lib;sfml-audio.lib;sfml-network.lib;%(AdditionalDependencies)</AdditionalDependencies>
    </Link>
  </ItemDefinitionGroup>
  <ItemDefinitionGroup Condition="'$(Configuration)|$(Platform)'=='Debug|x64'">
    <ClCompile>
      <WarningLevel>Level3</WarningLevel>
      <SDLCheck>true</SDLCheck>
      <PreprocessorDefinitions>_DEBUG;_CONSOLE;%(PreprocessorDefinitions)</PreprocessorDefinitions>
      <ConformanceMode>true</ConformanceMode>
      <AdditionalIncludeDirectories>C:\Projects\S2_OOPs_Assignment\Z-Runner\External\include</AdditionalIncludeDirectories>
      <AdditionalUsingDirectories>
      </AdditionalUsingDirectories>
      <LanguageStandard>stdcpp17</LanguageStandard>
    </ClCompile>
    <Link>
      <SubSystem>Console</SubSystem>
      <GenerateDebugInformation>true</GenerateDebugInformation>
      <AdditionalLibraryDirectories>C:\Projects\S2_OOPs_Assignment\Z-Runner\External\lib;%(AdditionalLibraryDirectories)</AdditionalLibraryDirectories>
      <AdditionalDependencies>sfml-system-d.lib;sfml-graphics-d.lib;sfml-window-d.lib;sfml-audio-d.lib;sfml-network-d.lib;%(AdditionalDependencies)</AdditionalDependencies>
    </Link>
  </ItemDefinitionGroup>
  <ItemDefinitionGroup Condition="'$(Configuration)|$(Platform)'=='Release|x64'">
    <ClCompile>
      <WarningLevel>Level3</WarningLevel>
      <FunctionLevelLinking>true</FunctionLevelLinking>
      <IntrinsicFunctions>true</IntrinsicFunctions>
      <SDLCheck>true</SDLCheck>
      <PreprocessorDefinitions>NDEBUG;_CONSOLE;%(PreprocessorDefinitions)</PreprocessorDefinitions>
      <ConformanceMode>true</ConformanceMode>
      <AdditionalIncludeDirectories>C:\Projects\S2_OOPs_Assignment\Z-Runner\External\include</AdditionalIncludeDirectories>
      <AdditionalUsingDirectories>
      </AdditionalUsingDirectories>
      <LanguageStandard>stdcpp17</LanguageStandard>
    </ClCompile>
    <Link>
      <SubSystem>Console</SubSystem>
      <EnableCOMDATFolding>true</EnableCOMDATFolding>
      <OptimizeReferences>true</OptimizeReferences>
      <GenerateDebugInformation>true</GenerateDebugInformation>
      <AdditionalLibraryDirectories>C:\Projects\S2_OOPs_Assignment\Z-Runner\External\lib;%(AdditionalLibraryDirectories)</AdditionalLibraryDirectories>
      <AdditionalDependencies>sfml-system.lib;sfml-graphics.lib;sfml-window.lib;sfml-audio.lib;sfml-network.lib;%(AdditionalDependencies)</AdditionalDependencies>
    </Link>
  </ItemDefinitionGroup>
  <ItemGroup>
    <ClCompile Include="Character.cpp" />
    <ClCompile Include="Enemy.cpp" />
    <ClCompile Include="Game.cpp" />
    <ClCompile Include="Object.cpp" />
    <ClCompile Include="PathFinder.cpp" />
    <ClCompile Include="PathFindingNode.cpp" />
    <ClCompile Include="Platform.cpp" />
    <ClCompile Include="Player.cpp" />
    <ClCompile Include="Projectile.cpp" />
    <ClCompile Include="SceneGenerator.cpp" />
    <ClCompile Include="Z-Runner.cpp" />
  </ItemGroup>
  <ItemGroup>
    <ClInclude Include="Character.h" />
    <ClInclude Include="Enemy.h" />
    <ClInclude Include="Game.h" />
    <ClInclude Include="Object.h" />
    <ClInclude Include="PathFinder.h" />
    <ClInclude Include="PathFindingNode.h" />
    <ClInclude Include="Platform.h" />
    <ClInclude Include="Player.h" />
    <ClInclude Include="Projectile.h" />
    <ClInclude Include="SceneGenerator.h" />
  </ItemGroup>
  <Import Project="$(VCTargetsPath)\Microsoft.Cpp.targets" />
  <ImportGroup Label="ExtensionTargets">
  </ImportGroup>
</Project>
```

### Z-Runner\Z-Runner.vcxproj.filters
```
﻿<?xml version="1.0" encoding="utf-8"?>
<Project ToolsVersion="4.0" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
  <ItemGroup>
    <Filter Include="Source Files">
      <UniqueIdentifier>{4FC737F1-C7A5-4376-A066-2A32D752A2FF}</UniqueIdentifier>
      <Extensions>cpp;c;cc;cxx;c++;cppm;ixx;def;odl;idl;hpj;bat;asm;asmx</Extensions>
    </Filter>
    <Filter Include="Header Files">
      <UniqueIdentifier>{93995380-89BD-4b04-88EB-625FBE52EBFB}</UniqueIdentifier>
      <Extensions>h;hh;hpp;hxx;h++;hm;inl;inc;ipp;xsd</Extensions>
    </Filter>
    <Filter Include="Resource Files">
      <UniqueIdentifier>{67DA6AB6-F800-4c08-8B7A-83BB121AAD01}</UniqueIdentifier>
      <Extensions>rc;ico;cur;bmp;dlg;rc2;rct;bin;rgs;gif;jpg;jpeg;jpe;resx;tiff;tif;png;wav;mfcribbon-ms</Extensions>
    </Filter>
  </ItemGroup>
  <ItemGroup>
    <ClCompile Include="Z-Runner.cpp">
      <Filter>Source Files</Filter>
    </ClCompile>
    <ClCompile Include="Game.cpp">
      <Filter>Source Files</Filter>
    </ClCompile>
    <ClCompile Include="Enemy.cpp">
      <Filter>Source Files</Filter>
    </ClCompile>
    <ClCompile Include="Platform.cpp">
      <Filter>Source Files</Filter>
    </ClCompile>
    <ClCompile Include="Player.cpp">
      <Filter>Source Files</Filter>
    </ClCompile>
    <ClCompile Include="Projectile.cpp">
      <Filter>Source Files</Filter>
    </ClCompile>
    <ClCompile Include="SceneGenerator.cpp">
      <Filter>Source Files</Filter>
    </ClCompile>
    <ClCompile Include="PathFinder.cpp">
      <Filter>Source Files</Filter>
    </ClCompile>
    <ClCompile Include="PathFindingNode.cpp">
      <Filter>Source Files</Filter>
    </ClCompile>
    <ClCompile Include="Object.cpp">
      <Filter>Source Files</Filter>
    </ClCompile>
    <ClCompile Include="Character.cpp">
      <Filter>Source Files</Filter>
    </ClCompile>
  </ItemGroup>
  <ItemGroup>
    <ClInclude Include="Game.h">
      <Filter>Header Files</Filter>
    </ClInclude>
    <ClInclude Include="Enemy.h">
      <Filter>Header Files</Filter>
    </ClInclude>
    <ClInclude Include="Platform.h">
      <Filter>Header Files</Filter>
    </ClInclude>
    <ClInclude Include="Player.h">
      <Filter>Header Files</Filter>
    </ClInclude>
    <ClInclude Include="Projectile.h">
      <Filter>Header Files</Filter>
    </ClInclude>
    <ClInclude Include="SceneGenerator.h">
      <Filter>Header Files</Filter>
    </ClInclude>
    <ClInclude Include="PathFinder.h">
      <Filter>Header Files</Filter>
    </ClInclude>
    <ClInclude Include="PathFindingNode.h">
      <Filter>Header Files</Filter>
    </ClInclude>
    <ClInclude Include="Object.h">
      <Filter>Header Files</Filter>
    </ClInclude>
    <ClInclude Include="Character.h">
      <Filter>Header Files</Filter>
    </ClInclude>
  </ItemGroup>
</Project>
```

### Z-Runner\Z-Runner.vcxproj.user
```
﻿<?xml version="1.0" encoding="utf-8"?>
<Project ToolsVersion="Current" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
  <PropertyGroup Condition="'$(Configuration)|$(Platform)'=='Debug|x64'">
    <DebuggerFlavor>WindowsLocalDebugger</DebuggerFlavor>
  </PropertyGroup>
  <PropertyGroup>
    <ShowAllFiles>false</ShowAllFiles>
  </PropertyGroup>
</Project>
```

### Z-Runner.sln
```
﻿
Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 17
VisualStudioVersion = 17.10.35013.160
MinimumVisualStudioVersion = 10.0.40219.1
Project("{8BC9CEB8-8B4A-11D0-8D11-00A0C91BC942}") = "Z-Runner", "Z-Runner\Z-Runner.vcxproj", "{01E5AB7E-5623-4563-B714-406831EA844D}"
EndProject
Global
	GlobalSection(SolutionConfigurationPlatforms) = preSolution
		Debug|x64 = Debug|x64
		Debug|x86 = Debug|x86
		Release|x64 = Release|x64
		Release|x86 = Release|x86
	EndGlobalSection
	GlobalSection(ProjectConfigurationPlatforms) = postSolution
		{01E5AB7E-5623-4563-B714-406831EA844D}.Debug|x64.ActiveCfg = Debug|x64
		{01E5AB7E-5623-4563-B714-406831EA844D}.Debug|x64.Build.0 = Debug|x64
		{01E5AB7E-5623-4563-B714-406831EA844D}.Debug|x86.ActiveCfg = Debug|Win32
		{01E5AB7E-5623-4563-B714-406831EA844D}.Debug|x86.Build.0 = Debug|Win32
		{01E5AB7E-5623-4563-B714-406831EA844D}.Release|x64.ActiveCfg = Release|x64
		{01E5AB7E-5623-4563-B714-406831EA844D}.Release|x64.Build.0 = Release|x64
		{01E5AB7E-5623-4563-B714-406831EA844D}.Release|x86.ActiveCfg = Release|Win32
		{01E5AB7E-5623-4563-B714-406831EA844D}.Release|x86.Build.0 = Release|Win32
	EndGlobalSection
	GlobalSection(SolutionProperties) = preSolution
		HideSolutionNode = FALSE
	EndGlobalSection
	GlobalSection(ExtensibilityGlobals) = postSolution
		SolutionGuid = {82180E5A-CD01-432C-A599-F8A5B67676D8}
	EndGlobalSection
EndGlobal

```

