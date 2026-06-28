/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.geometry.Pos
 *  javafx.scene.Group
 *  javafx.scene.Node
 *  javafx.scene.control.Label
 *  javafx.scene.image.ImageView
 *  javafx.scene.layout.AnchorPane
 */
package de.hhn.seb.labsw.laspoly.model.field.specialfield;

import de.hhn.seb.labsw.laspoly.model.action.TransactionAction;
import de.hhn.seb.labsw.laspoly.model.card.Card;
import de.hhn.seb.labsw.laspoly.model.card.PayToCasinoCard;
import de.hhn.seb.labsw.laspoly.model.field.Field;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.Casino;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.SpecialField;
import de.hhn.seb.labsw.laspoly.model.figure.Figure;
import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import de.hhn.seb.labsw.laspoly.view.View;
import de.hhn.seb.labsw.laspoly.view.game.GameHandler;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.GameScene;
import javafx.geometry.Pos;
import javafx.scene.Group;
import javafx.scene.Node;
import javafx.scene.control.Label;
import javafx.scene.image.ImageView;
import javafx.scene.layout.AnchorPane;

public class PayToCasinoField
extends SpecialField {
    private final NodeHolder nodes = new NodeHolder();
    private final PayToCasinoCard previewCard = new PayToCasinoCard();

    public PayToCasinoField(int pos) {
        super(pos);
    }

    @Override
    public Card getPreviewCard() {
        return this.previewCard;
    }

    @Override
    public Card createNewPreviewCard() {
        return new PayToCasinoCard();
    }

    @Override
    public String getName() {
        return GameScene.getResources().getString("payintocasino_name");
    }

    @Override
    public void onFigureEntered(Figure fig, GameHandler handler) {
        if (handler.getPlayer(fig.getUser()).removeMoney(100)) {
            TransactionAction transactionRemove = new TransactionAction(fig.getUser(), 100, false, handler.getClientPlayer().getUser());
            handler.addAction(transactionRemove);
            ((Casino)handler.getField(20)).addMoney(100);
            TransactionAction transactionAdd = new TransactionAction(Casino.CASINO_USER, 100, true, handler.getClientPlayer().getUser());
            handler.addAction(transactionAdd);
        } else {
            handler.kickPlayer(fig.getUser(), "lostNoMoneyLeft");
        }
    }

    @Override
    public Group draw() {
        Group group = super.draw();
        AnchorPane.setTopAnchor((Node)this.nodes.nameLabel, (Double)90.0);
        group.getChildren().add(this.nodes.textGroup);
        group.getChildren().add(this.nodes.imageGroup);
        return group;
    }

    @Override
    public double getWidth() {
        return 100.0;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "nodes=" + this.nodes + ", previewCard=" + this.previewCard + '}';
    }

    public class NodeHolder
    extends Field.NodeHolder {
        private final EnhancedGroup textGroup = new EnhancedGroup();
        private final EnhancedGroup imageGroup;
        private AnchorPane textPane = this.createLabeledPane(" ");
        private Label nameLabel;

        public NodeHolder() {
            this.textGroup.setRz(180.0);
            this.textGroup.setRx(270.0);
            this.textGroup.setTy(11.0);
            this.textGroup.setTx(50.0);
            this.textGroup.setTz(75.0);
            this.imageGroup = new EnhancedGroup();
            ImageView imgV = new ImageView(DataLoader.getInstance().getGameImage(GameImage.IC_PAY));
            imgV.setFitHeight(64.0);
            imgV.setFitWidth(64.0);
            AnchorPane pane = this.getTextPane();
            pane.getChildren().clear();
            pane.getChildren().add(imgV);
            AnchorPane.setLeftAnchor((Node)imgV, (Double)18.0);
            AnchorPane.setRightAnchor((Node)imgV, (Double)18.0);
            AnchorPane.setTopAnchor((Node)imgV, (Double)10.0);
            this.imageGroup.getChildren().addAll(new Node[]{pane});
            this.imageGroup.setRz(180.0);
            this.imageGroup.setRx(270.0);
            this.imageGroup.setTy(11.0);
            this.imageGroup.setTx(50.0);
            this.imageGroup.setTz(75.0);
        }

        public AnchorPane getTextPane() {
            return this.textPane;
        }

        protected AnchorPane createLabeledPane(String name) {
            this.nameLabel = new Label(name);
            this.nameLabel.setFont(View.Fonts.fieldFont(12));
            AnchorPane pane = new AnchorPane(new Node[]{this.nameLabel});
            pane.setPrefWidth(100.0);
            pane.setPrefHeight(150.0);
            this.nameLabel.setAlignment(Pos.CENTER);
            AnchorPane.setLeftAnchor((Node)this.nameLabel, (Double)0.0);
            AnchorPane.setRightAnchor((Node)this.nameLabel, (Double)0.0);
            AnchorPane.setTopAnchor((Node)this.nameLabel, (Double)47.5);
            pane.setCache(true);
            this.nameLabel.setCache(true);
            PayToCasinoField.this.registerMouseCallbacks((Node)pane);
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
        public double getBottomHeight() {
            return super.getBottomHeight() + 10.0;
        }

        @Override
        public String toString() {
            return this.getClass().getName() + "{" + "textGroup=" + this.textGroup + ", imageGroup=" + this.imageGroup + ", textPane=" + this.textPane + ", nameLabel=" + this.nameLabel + '}';
        }
    }
}

