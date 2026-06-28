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

public class Hotel
extends Building {
    private final NodeHolder nodes;
    private final Logger logger = LoggerFactory.initializeLogger(this.getClass(), "de/hhn/seb/labsw/laspoly/view/view_logging.properties");

    public Hotel() {
        this.nodes = new NodeHolder();
    }

    @Override
    public Node draw() {
        Group graphicsGroup = new Group();
        graphicsGroup.getChildren().addAll(new Node[]{this.nodes.hotel});
        return graphicsGroup;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "nodes=" + this.nodes + '}';
    }

    public class NodeHolder
    extends Building.NodeHolder {
        private EnhancedGroup hotel;

        public NodeHolder() {
            DataLoader loader = DataLoader.getInstance();
            try {
                EnhancedGroup blueprint;
                this.hotel = blueprint = loader.getGameSceneForm(GameSceneModelSource.HOTEL).clone();
                this.hotel.setRy(90.0);
                this.hotel.setScale(1.7);
            }
            catch (CloneNotSupportedException e) {
                Hotel.this.logger.severe("Cloning failed:" + e.getMessage());
                StringWriter errors = new StringWriter();
                e.printStackTrace(new PrintWriter(errors));
                Hotel.this.logger.severe(errors.toString());
            }
        }

        public String toString() {
            return this.getClass().getName() + "{" + "hotel=" + this.hotel + '}';
        }
    }
}

