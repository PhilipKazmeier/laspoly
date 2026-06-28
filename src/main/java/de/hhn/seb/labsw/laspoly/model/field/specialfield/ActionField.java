/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.Group
 *  javafx.scene.Node
 *  javafx.scene.image.ImageView
 *  javafx.scene.layout.AnchorPane
 */
package de.hhn.seb.labsw.laspoly.model.field.specialfield;

import de.hhn.seb.labsw.laspoly.model.card.Card;
import de.hhn.seb.labsw.laspoly.model.card.action.ActionCard;
import de.hhn.seb.labsw.laspoly.model.card.preview.ActionFieldPreviewCard;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.SpecialField;
import de.hhn.seb.labsw.laspoly.model.figure.Figure;
import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import de.hhn.seb.labsw.laspoly.view.game.GameHandler;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.GameScene;
import javafx.scene.Group;
import javafx.scene.Node;
import javafx.scene.image.ImageView;
import javafx.scene.layout.AnchorPane;

public class ActionField
extends SpecialField {
    private final ActionFieldPreviewCard previewCard = new ActionFieldPreviewCard();

    public ActionField(int pos) {
        super(pos);
    }

    @Override
    public Card getPreviewCard() {
        return this.previewCard;
    }

    @Override
    public Card createNewPreviewCard() {
        return new ActionFieldPreviewCard();
    }

    @Override
    public String getName() {
        return GameScene.getResources().getString("actionfield_name");
    }

    @Override
    public void onFigureEntered(Figure fig, GameHandler handler) {
        ActionCard card = handler.drawCard();
        card.activate(fig, handler);
    }

    @Override
    public Group draw() {
        Group graphicsGroup = super.draw();
        ImageView imgV = new ImageView(DataLoader.getInstance().getGameImage(GameImage.IC_ACTIONCARD));
        imgV.setFitHeight(64.0);
        imgV.setFitWidth(64.0);
        EnhancedGroup imageGrp = new EnhancedGroup();
        AnchorPane pane = new AnchorPane(new Node[]{imgV});
        pane.setPrefWidth(100.0);
        pane.setPrefHeight(150.0);
        AnchorPane.setLeftAnchor((Node)imgV, (Double)0.0);
        AnchorPane.setRightAnchor((Node)imgV, (Double)0.0);
        AnchorPane.setTopAnchor((Node)imgV, (Double)47.5);
        this.registerMouseCallbacks((Node)pane);
        imageGrp.getChildren().addAll(new Node[]{pane});
        imageGrp.setRz(180.0);
        imageGrp.setRx(270.0);
        imageGrp.setTy(11.0);
        imageGrp.setTx(34.0);
        imageGrp.setTz(75.0);
        graphicsGroup.getChildren().add(imageGrp);
        return graphicsGroup;
    }

    @Override
    public double getWidth() {
        return 100.0;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "previewCard=" + this.previewCard + '}';
    }
}

