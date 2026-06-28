package de.hhn.labsw.laspoly.view.game.gamescene;
import de.hhn.labsw.laspoly.model.Figure;
import de.hhn.labsw.laspoly.utils.Xform;
import javafx.event.EventHandler;
import javafx.scene.DepthTest;
import javafx.scene.Group;
import javafx.scene.ImageCursor;
import javafx.scene.LightBase;
import javafx.scene.PerspectiveCamera;
import javafx.scene.PointLight;
import javafx.scene.SceneAntialiasing;
import javafx.scene.SubScene;
import javafx.scene.image.Image;
import javafx.scene.input.KeyEvent;
import javafx.scene.input.MouseEvent;
import javafx.scene.input.ScrollEvent;
import javafx.scene.paint.Color;
import javafx.scene.paint.PhongMaterial;
import javafx.scene.shape.Box;

import java.net.URL;

/**
 * GameScene is a SubScene and is responsible for displaying the whole game world.
 * Therefore GameScene contains all the relevant 3D logic and renders game board, fields etc.
 * Additionally GameScene handles Mouse and Keyboard input (Mainly for debugging purposes)
 */
public class GameScene extends SubScene {
    private static final Group root = new Group();

    // ------------------ START OF DEBUGGING PARAMETERS ------------------
    /**
     * If true, you can rotate the game board by 360° in all directions
     * RELEASE MODE: false
     */
    private static final boolean ENABLE_CAMERA_DEBUGGING = false;
    /**
     * If set true axes will be drawn in the 3D scene.
     * RELEASE MODE: false
     */
    private static final boolean DRAW_ROOM = true;
    /**
     * If set true a virtual room with the table will be drawn in the 3D scene.
     * RELEASE MODE: false
     */
    private static final boolean DRAW_AXES = false;
    // ------------------  END OF DEBUGGING PARAMETERS  ------------------
    /**
     * X and Y angle of the PerspectiveCamera.
     */
    private static final double[] DEF_CAMERA_ANGLE = {35, 15};
    /**
     * Coordinates which are closer at the camera than that value
     * are not painted.
     */
    private static final double DEF_CAMERA_NEAR_CLIP = 0.1;
    /**
     * Coordinates which are further away from the camera than that value
     * are not painted.
     */
    private static final double DEF_CAMERA_FAR_CLIP = 20000.0;
    private static final double ROTATION_SPEED = 0.3;
    /**
     * Zoom: The distance between the camera and the center point.
     */
    private static final double
            MAX_ZOOM = ENABLE_CAMERA_DEBUGGING ? -10000 : -4000,
            MIN_ZOOM = ENABLE_CAMERA_DEBUGGING ? 10000 : -1200,
            DEF_ZOOM = -4000;
    private static final int ARROW_PRESS_MULTIPLIER = 10;
    /**
     * Groups for rendering.
     */
    private final Group playerGroup, lightGroup, axesGroup;
    /**
     * Groups for the camera and more.
     */
    private Xform textGroup, world, camXYrotation, camXYtranslation, camZrotation;
    /**
     * This is the camera which makes everything visible.
     * The camera translations specify the position in which
     * the user views the game.
     */
    private PerspectiveCamera camera = new PerspectiveCamera(true);
    /**
     * The game board. It contains the game fields.
     */
    private Board board;
    /**
     * The room with the table on which the game board lies.
     */
    private Room room;

    /**
     * Create a new SubScene containing the 3D game.
     */
    public GameScene() {
        super(root, 850, 500, true, SceneAntialiasing.BALANCED);
        assignVariables();
        root.getChildren().add(world);
        root.setDepthTest(DepthTest.ENABLE);
        world.getChildren().add(textGroup);
        handleMouse();
        setFill(Color.WHITESMOKE);
        setCamera(camera);
        buildCamera();
        axesGroup = buildAxes();
        playerGroup = buildBoard();
        lightGroup = buildLight();
        world.getChildren().add(playerGroup);
        if (DRAW_ROOM) {
            world.getChildren().add(room.draw());
        }
        root.getChildren().addAll(lightGroup);

        final URL imgResURL = getClass().getResource("cursor_rotate.png");
        setCursor(new ImageCursor(new Image(imgResURL.toString())));
    }

    /**
     * Assign non-final variables.
     */
    private void assignVariables() {
        camXYrotation = new Xform();
        camXYtranslation = new Xform();
        camZrotation = new Xform();
        textGroup = new Xform();
        world = new Xform();
        board = new Board();
        room = new Room();
    }

    /**
     * Handles mouse events.
     */
    private void handleMouse() {
        final int X = 0, Y = 1;
        final double[]
                curMouse = {0, 0},
                oldMouse = {0, 0},
                deltaMouse = {0, 0};
        setOnMousePressed(new EventHandler<MouseEvent>() {
            @Override
            public void handle(MouseEvent me) {
                curMouse[X] = me.getSceneX();
                curMouse[Y] = me.getSceneY();
                oldMouse[X] = me.getSceneX();
                oldMouse[Y] = me.getSceneY();
            }
        });
        setOnMouseDragged(new EventHandler<MouseEvent>() {
            @Override
            public void handle(MouseEvent me) {
                oldMouse[X] = curMouse[X];
                oldMouse[Y] = curMouse[Y];
                curMouse[X] = me.getSceneX();
                curMouse[Y] = me.getSceneY();
                deltaMouse[X] = (curMouse[X] - oldMouse[X]);
                deltaMouse[Y] = (curMouse[Y] - oldMouse[Y]);

                if (me.isPrimaryButtonDown()) {
                    camXYrotation.ry.setAngle(camXYrotation.ry.getAngle() - deltaMouse[X] * ROTATION_SPEED);
                    final double newXAngle = camXYrotation.rx.getAngle() + deltaMouse[Y] * ROTATION_SPEED;
                    if (newXAngle > 10 && newXAngle < 80
                            || ENABLE_CAMERA_DEBUGGING /*TODO remove after debugging phase*/) {
                        camXYrotation.rx.setAngle(newXAngle);
                    }
                }
                for (Figure figure : board.getFigures()) {
                    figure.getFigure().setRy(camXYrotation.ry.getAngle());
                }
            }
        });
        setOnScroll(new EventHandler<ScrollEvent>() {
            @Override
            public void handle(ScrollEvent me) {
                double z = camera.getTranslateZ();
                double newZ = z + me.getDeltaY();
                if (newZ > MAX_ZOOM && newZ < MIN_ZOOM) {
                    camera.setTranslateZ(newZ);
                }
            }
        });
    }

    /**
     * Sets up camera specific functions.
     */
    private void buildCamera() {
        root.getChildren().add(camXYrotation);
        camXYrotation.getChildren().add(camXYtranslation);
        camXYtranslation.getChildren().add(camZrotation);
        camZrotation.getChildren().add(camera);
        camZrotation.setRotateZ(180.0);

        camera.setNearClip(DEF_CAMERA_NEAR_CLIP);
        camera.setFarClip(DEF_CAMERA_FAR_CLIP);
        camera.setTranslateZ(DEF_ZOOM);
        camXYrotation.ry.setAngle(DEF_CAMERA_ANGLE[0]);
        camXYrotation.rx.setAngle(DEF_CAMERA_ANGLE[1]);

        for (Figure figure : board.getFigures()) {
            figure.getFigure().setRy(camXYrotation.ry.getAngle() + 85);
        }
    }

    /**
     * Adds the default X,Y,Z axes.
     */
    private Group buildAxes() {
        Group group = new Group();
        final Box[] axes = {new Box(1, 1000, 1), new Box(2000, 1, 1), new Box(1, 1, 2000)};
        axes[0].setMaterial(new PhongMaterial(Color.BLACK));
        axes[1].setMaterial(new PhongMaterial(Color.BLUE));
        axes[2].setMaterial(new PhongMaterial(Color.RED));
        group.getChildren().addAll(axes);
        return group;
    }

    /**
     * Created a Group that contains the game board.
     */
    private Group buildBoard() {
        Group group = new Xform();
        group.getChildren().add(board.draw());
        return group;
    }

    /**
     * Creates a group that contains all light nodes.
     */
    private Group buildLight() {
        Group group = new Group();
        LightBase
                sun = new PointLight(Color.WHITE),
                spotLight = new PointLight(Color.WHITE);
//        sun.setTranslateX(1000); // TODO adjust
        sun.setTranslateY(1000);
//        sun.setTranslateZ(1000);

        spotLight.setTranslateX(-600); // TODO: adjust when player moves
        spotLight.setTranslateY(60);
        spotLight.setTranslateZ(-650);
        group.getChildren().addAll(sun, spotLight);
        return group;
    }

    /**
     * Called from the parent scene of this element when this is focused and a key is pressed.
     *
     * @param event {@link javafx.scene.input.KeyEvent}.
     */
    public void onKeyPressed(KeyEvent event) {
        switch (event.getCode()) {
            case LEFT:
//                camXYrotation.ry.setAngle(camXYrotation.ry.getAngle() - ARROW_PRESS_MULTIPLIER * ROTATION_SPEED);
                camXYtranslation.t.setX(camXYtranslation.t.getX() + ARROW_PRESS_MULTIPLIER);
                break;
            case RIGHT:
//                camXYrotation.ry.setAngle(camXYrotation.ry.getAngle() + ARROW_PRESS_MULTIPLIER * ROTATION_SPEED);
                camXYtranslation.t.setX(camXYtranslation.t.getX() - ARROW_PRESS_MULTIPLIER);
                break;
            case UP:
//                final double newAngle1= camXYrotation.rx.getAngle() + ARROW_PRESS_MULTIPLIER * ROTATION_SPEED;
//                if (newAngle1 >= 10 && newAngle1 <= 80) camXYrotation.rx.setAngle(newAngle1);
//                camXYtranslation.t.setY(camXYtranslation.t.getY() + ARROW_PRESS_MULTIPLIER);
                double z = camera.getTranslateZ();
                double newZ = z + ARROW_PRESS_MULTIPLIER * 3;
                if (newZ > MAX_ZOOM && newZ < MIN_ZOOM) {
                    camera.setTranslateZ(newZ);
//                    camXYtranslation.t.setX(camXYtranslation.t.getX() +
//                            ARROW_PRESS_MULTIPLIER);  // -
//                    camXYtranslation.t.setY(camXYtranslation.t.getY() +
//                            ARROW_PRESS_MULTIPLIER);  // -
                }
                break;
            case DOWN:
//                final double newXAngle2= camXYrotation.rx.getAngle() - ARROW_PRESS_MULTIPLIER * ROTATION_SPEED;
//                if (newXAngle2 >= 10 && newXAngle2 <= 80) camXYrotation.rx.setAngle(newXAngle2);
//                camXYtranslation.t.setY(camXYtranslation.t.getY() - ARROW_PRESS_MULTIPLIER);
                double z2 = camera.getTranslateZ();
                double newZ2 = z2 - ARROW_PRESS_MULTIPLIER * 3;
                if (newZ2 > MAX_ZOOM && newZ2 < MIN_ZOOM) {
                    camera.setTranslateZ(newZ2);
//                    camXYtranslation.t.setX(camXYtranslation.t.getX() -
//                            2*5);  // -
//                    camXYtranslation.t.setY(camXYtranslation.t.getY() -
//                            2*5);  // -
                }
                break;
        }
    }
}