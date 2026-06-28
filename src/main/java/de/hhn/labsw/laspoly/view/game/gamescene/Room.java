package de.hhn.labsw.laspoly.view.game.gamescene;

import de.hhn.labsw.laspoly.main.Main;
import de.hhn.labsw.laspoly.view.View;
import de.hhn.labsw.laspoly.view.paint.AbsNodeHolder;
import de.hhn.labsw.laspoly.view.paint.Drawable;
import de.hhn.labsw.laspoly.view.paint.Material;
import javafx.scene.Group;
import javafx.scene.Node;
import javafx.scene.image.Image;
import javafx.scene.paint.PhongMaterial;
import javafx.scene.shape.Box;

import java.net.URL;

public class Room implements Drawable {
    public static final double TABLE_HEIGHT = 50;
    public static final double HALF_TABLE_HEIGHT = TABLE_HEIGHT / 2.0;
    public static final double TABLE_WIDTH = 1500;
    public static final double TABLE_DEPTH = 1500;
    public static final PhongMaterial TABLE_TOP_MATERIAL = Material.RED;
    public static final double FLOOR_HEIGHT = 300;
    public static final double HALF_FLOOR_HEIGHT = FLOOR_HEIGHT / 2.0;
    public static final double FLOOR_WIDTH = 10000;
    public static final double FLOOR_DEPTH = 10000;
    public static final double TABLE_BASE_HEIGHT = 600;
    public static final double TABLE_BASE_WIDTH = 200;
    public static final double TABLE_BASE_DEPTH = TABLE_BASE_WIDTH;
    public static final PhongMaterial TABLE_BASE_MATERIAL = Material.BLACK;
    public final double HALF_TABLE_WIDTH = TABLE_WIDTH / 2.0;
    public final double HALF_TABLE_BASE_WIDTH = TABLE_BASE_WIDTH / 2.0;
    public final double HALF_TABLE_DEPTH = TABLE_DEPTH/ 2.0;
    public final double HALF_TABLE_BASE_DEPTH = TABLE_BASE_DEPTH / 2.0;
    public final double HALF_TABLE_BASE_HEIGHT = TABLE_BASE_HEIGHT / 2.0;
    private final NodeHolder nodes;

    public Room() {
        nodes = new NodeHolder();
    }

    @Override
    public Node draw() {
        Group graphicsGroup = new Group();
        graphicsGroup.getChildren().addAll(nodes.tableTop/*, nodes.floor*/);
//        graphicsGroup.getChildren().addAll(nodes.tableBases);
//        graphicsGroup.getChildren().addAll(nodes.walls);
        return graphicsGroup;
    }

    /**
     * This class manages the creation and storage of 3D Shapes. Every shape that can be reused should be stored in
     * here. The Shapes have to be created only once and on redraw, it is sufficient to change only the shape properties
     * that have changed
     */
    public class NodeHolder extends AbsNodeHolder {
        /**
         * The bottom cuboid symbolizes the walls of a building.
         */
        protected final Box tableTop;
        protected final Box floor;
        protected final Box[] tableBases;
        protected final Box[] walls;

        /**
         * Creates all shapes and gives them their default configuration.
         */
        public NodeHolder() {
            tableTop = new Box(TABLE_WIDTH, TABLE_HEIGHT, TABLE_DEPTH);
            tableTop.setCache(true);
            tableTop.setMaterial(TABLE_TOP_MATERIAL);
            tableTop.setTranslateY(-Board.HEIGHT - HALF_TABLE_HEIGHT);

            floor = new Box(FLOOR_WIDTH,FLOOR_HEIGHT, FLOOR_DEPTH);
            floor.setMaterial(Material.GREEN);
            floor.setTranslateY(getBottomHeight() + HALF_FLOOR_HEIGHT);

            walls = new Box[2];
            walls[0] = new Box(5,1200,1800);
            walls[0].setMaterial(View.Materials.FIGURE1_MATERIAL);
            walls[0].setTranslateX(FLOOR_WIDTH / 2.0);
            walls[1] = new Box(1800,1200,5);
            walls[1].setMaterial(View.Materials.FIGURE1_MATERIAL);
            final URL imgResURL = Main.class.getResource("UserIcon" + (1) + ".png");
            Image pattern = new Image(imgResURL.toString());
//            walls[1].setFill(new ImagePattern(new Image(getClass().getResource("")), 20, 20, 40, 40, false));
            walls[1].setTranslateZ(FLOOR_WIDTH / 2.0);

            walls[0].setTranslateY(getBottomHeight() + 1700);
            walls[1].setTranslateY(getBottomHeight() + 1700);

            tableBases = new Box[4];
            for (int i = 0; i < tableBases.length; i++) {
                tableBases[i] = new Box(TABLE_BASE_WIDTH, TABLE_BASE_HEIGHT, TABLE_BASE_DEPTH);
                tableBases[i].setMaterial(TABLE_BASE_MATERIAL);
                tableBases[i].setTranslateX(
                        (i+1) % 2 == 0 ?
                                + HALF_TABLE_WIDTH - HALF_TABLE_BASE_WIDTH:
                                - HALF_TABLE_WIDTH + HALF_TABLE_BASE_WIDTH
                );
                tableBases[i].setTranslateZ(
                       i < 2?
                                +HALF_TABLE_DEPTH - HALF_TABLE_BASE_DEPTH :
                                -HALF_TABLE_DEPTH + HALF_TABLE_BASE_DEPTH
                );
                tableBases[i].setTranslateY(-Board.HEIGHT - TABLE_HEIGHT - HALF_TABLE_BASE_HEIGHT);
            }
        }

        @Override
        public double getBottomHeight() {
            return -Board.HEIGHT - TABLE_HEIGHT - TABLE_BASE_HEIGHT - FLOOR_HEIGHT;
        }
    }
}
