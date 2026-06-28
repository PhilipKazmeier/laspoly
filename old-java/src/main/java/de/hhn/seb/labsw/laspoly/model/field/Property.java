/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.application.Platform
 *  javafx.beans.property.Property
 *  javafx.beans.property.SimpleBooleanProperty
 *  javafx.geometry.Pos
 *  javafx.scene.Group
 *  javafx.scene.Node
 *  javafx.scene.control.Label
 *  javafx.scene.layout.AnchorPane
 *  javafx.scene.paint.Color
 *  javafx.scene.shape.Box
 *  javafx.scene.text.TextAlignment
 */
package de.hhn.seb.labsw.laspoly.model.field;

import de.hhn.seb.labsw.laspoly.model.Player;
import de.hhn.seb.labsw.laspoly.model.field.Field;
import de.hhn.seb.labsw.laspoly.model.field.Groupable;
import de.hhn.seb.labsw.laspoly.model.priceinfo.PriceInfo;
import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import de.hhn.seb.labsw.laspoly.view.View;
import java.util.logging.Logger;
import javafx.application.Platform;
import javafx.beans.property.SimpleBooleanProperty;
import javafx.geometry.Pos;
import javafx.scene.Group;
import javafx.scene.Node;
import javafx.scene.control.Label;
import javafx.scene.layout.AnchorPane;
import javafx.scene.paint.Color;
import javafx.scene.shape.Box;
import javafx.scene.text.TextAlignment;

public abstract class Property
extends Field
implements Groupable {
    private final NodeHolder nodes;
    private final String name;
    private final Group rootGroup = new Group();
    private final Logger logger;
    private Player owner;
    private javafx.beans.property.Property<Boolean> mortgaged;

    public Property(int pos, String propertyName) {
        super(pos);
        this.name = propertyName;
        this.logger = LoggerFactory.initializeLogger(this.getClass(), "de/hhn/seb/labsw/laspoly/view/game/gamescene/gamescene_logging.properties");
        this.nodes = new NodeHolder();
        this.mortgaged = new SimpleBooleanProperty(false);
    }

    public boolean isMortgaged() {
        return (Boolean)this.mortgaged.getValue();
    }

    public void setMortgaged(boolean isMortgaged) {
        this.mortgaged.setValue(isMortgaged);
        if (isMortgaged) {
            this.setMaterials(View.Materials.FIELD_MORTG_MATERIAL, View.Materials.FIELD_MORTG_MATERIAL_HOVER);
        } else {
            this.setMaterials(View.Materials.FIELD_MATERIAL, View.Materials.FIELD_MATERIAL_HOVER);
        }
    }

    public abstract int getPrice();

    @Override
    public String getName() {
        return this.name;
    }

    @Override
    public Group draw() {
        return this.draw(47.5);
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "nodes=" + this.nodes + ", name='" + this.name + '\'' + ", rootGroup=" + this.rootGroup + ", owner=" + this.owner + ", mortgaged=" + this.mortgaged + '}';
    }

    protected Group draw(double textOffsetTop) {
        this.rootGroup.getChildren().clear();
        Group group = super.draw();
        AnchorPane.setTopAnchor((Node)this.nodes.nameLabel, (Double)textOffsetTop);
        group.getChildren().add(this.nodes.textGroup);
        if (this.getOwner() != null) {
            group.getChildren().add(this.nodes.createOwnerLabel());
        }
        this.rootGroup.getChildren().add(group);
        return this.rootGroup;
    }

    public Player getOwner() {
        return this.owner;
    }

    public void setOwner(Player newOwner) {
        this.owner = newOwner;
        Platform.runLater(this::draw);
    }

    public abstract PriceInfo getPriceInfo();

    public class NodeHolder
    extends Field.NodeHolder {
        private final EnhancedGroup textGroup = new EnhancedGroup();
        private AnchorPane textPane = this.createLabeledPane();
        private Label nameLabel;

        public NodeHolder() {
            this.textGroup.setRz(180.0);
            this.textGroup.setRx(270.0);
            this.textGroup.setTy(11.0);
            this.textGroup.setTx(50.0);
            this.textGroup.setTz(75.0);
        }

        protected AnchorPane createLabeledPane() {
            this.nameLabel = new Label(Property.this.getName());
            this.nameLabel.setFont(View.Fonts.fieldFont(12));
            this.nameLabel.setAlignment(Pos.CENTER);
            this.nameLabel.setTextAlignment(TextAlignment.CENTER);
            this.nameLabel.setPrefWidth(80.0);
            this.nameLabel.setWrapText(true);
            AnchorPane pane = new AnchorPane(new Node[]{this.nameLabel});
            pane.setPrefHeight(150.0);
            AnchorPane.setLeftAnchor((Node)this.nameLabel, (Double)10.0);
            AnchorPane.setRightAnchor((Node)this.nameLabel, (Double)10.0);
            AnchorPane.setTopAnchor((Node)this.nameLabel, (Double)67.5);
            pane.setCache(true);
            this.nameLabel.setCache(true);
            Property.this.registerMouseCallbacks((Node)pane);
            this.textPane = pane;
            this.textGroup.getChildren().addAll(new Node[]{this.textPane});
            this.textGroup.setRz(180.0);
            this.textGroup.setRx(270.0);
            this.textGroup.setTy(11.0);
            this.textGroup.setTx(50.0);
            this.textGroup.setTz(75.0);
            return pane;
        }

        @Override
        protected Box createBaseShape() {
            Box box = super.createBaseShape();
            return box;
        }

        @Override
        public double getBottomHeight() {
            return super.getBottomHeight() + 10.0;
        }

        @Override
        public String toString() {
            return this.getClass().getName() + "{" + "textGroup=" + this.textGroup + ", textPane=" + this.textPane + ", nameLabel=" + this.nameLabel + '}';
        }

        public AnchorPane getTextPane() {
            return this.textPane;
        }

        public EnhancedGroup createOwnerLabel() {
            EnhancedGroup group = new EnhancedGroup();
            Label namelabel = (Label)FXMLFile.NAME_LABEL.toLayout(this.getClass());
            int[] rgb = new int[]{(int)(Property.this.getOwner().getColor().getRed() * 255.0), (int)(Property.this.getOwner().getColor().getGreen() * 255.0), (int)(Property.this.getOwner().getColor().getBlue() * 255.0)};
            String hex = String.format("#%02x%02x%02x", rgb[0], rgb[1], rgb[2]);
            String textFill = "-fx-text-fill: black;";
            if (Property.this.getOwner().getColor().equals(Color.BLACK) || Property.this.getOwner().getColor().equals(Color.BLUE) || Property.this.getOwner().getColor().equals(Color.GREEN) || Property.this.getOwner().getColor().equals(Color.GREY) || Property.this.getOwner().getColor().equals(Color.BROWN)) {
                textFill = "-fx-text-fill: white;";
            }
            namelabel.setStyle("-fx-background-color: " + hex + ";" + "-fx-background-radius: 7;" + textFill);
            namelabel.setText(Property.this.getOwner().getUser().getName());
            EnhancedGroup labelGroup = new EnhancedGroup();
            labelGroup.setRz(180.0);
            labelGroup.setRx(270.0);
            labelGroup.setTranslateZ(-40.0);
            labelGroup.setTranslateX(namelabel.getPrefWidth() / 2.0);
            labelGroup.setTranslateY(11.0);
            labelGroup.getChildren().add(namelabel);
            group.getChildren().add(labelGroup);
            Property.this.registerMouseCallbacks((Node)group);
            return group;
        }
    }
}

