/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.Group
 *  javafx.scene.Node
 */
package de.hhn.seb.labsw.laspoly.model.building;

import de.hhn.seb.labsw.laspoly.model.building.Building;
import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameSceneModelSource;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.logging.Logger;
import javafx.scene.Group;
import javafx.scene.Node;

public class House
extends Building {
    public static final double WIDTH = 23.0;
    private final NodeHolder nodes;
    private final Logger logger = LoggerFactory.initializeLogger(this.getClass(), "de/hhn/seb/labsw/laspoly/view/view_logging.properties");

    public House() {
        this.nodes = new NodeHolder();
    }

    @Override
    public Node draw() {
        Group graphicsGroup = new Group();
        graphicsGroup.getChildren().add(this.nodes.house);
        return graphicsGroup;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "nodes=" + this.nodes + '}';
    }

    public class NodeHolder
    extends Building.NodeHolder {
        private EnhancedGroup house;

        public NodeHolder() {
            try {
                this.house = DataLoader.getInstance().getGameSceneForm(GameSceneModelSource.HOUSE).clone();
                this.house.setRy(90.0);
                this.house.setScale(2.0);
                this.house.setTranslateY(15.0);
            }
            catch (CloneNotSupportedException e) {
                House.this.logger.severe("Cloning failed:" + e.getMessage());
                StringWriter errors = new StringWriter();
                e.printStackTrace(new PrintWriter(errors));
                House.this.logger.severe(errors.toString());
            }
        }

        public String toString() {
            return this.getClass().getName() + "{" + "house=" + this.house + '}';
        }
    }
}

