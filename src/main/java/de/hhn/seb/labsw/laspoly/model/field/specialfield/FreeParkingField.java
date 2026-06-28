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
import de.hhn.seb.labsw.laspoly.model.card.FreeParkingPreviewCard;
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

public class FreeParkingField
extends SpecialField {
    public static final int POSITION = 10;
    private static FreeParkingField field;
    private FreeParkingPreviewCard previewCard = new FreeParkingPreviewCard();

    public FreeParkingField() {
        super(10);
        field = this;
    }

    public static FreeParkingField getField() {
        return field;
    }

    @Override
    public Card getPreviewCard() {
        return this.previewCard;
    }

    @Override
    public Card createNewPreviewCard() {
        return new FreeParkingPreviewCard();
    }

    @Override
    public String getName() {
        return GameScene.getResources().getString("freeparking_name");
    }

    @Override
    public void onFigureEntered(Figure fig, GameHandler handler) {
    }

    @Override
    public Group draw() {
        Group graphicsGroup = super.draw();
        ImageView imgV = new ImageView(DataLoader.getInstance().getGameImage(GameImage.IC_PARKING));
        imgV.setFitHeight(64.0);
        imgV.setFitWidth(64.0);
        EnhancedGroup textGroup = new EnhancedGroup();
        AnchorPane pane = new AnchorPane(new Node[]{imgV});
        pane.setPrefWidth(100.0);
        pane.setPrefHeight(150.0);
        this.registerMouseCallbacks((Node)pane);
        textGroup.getChildren().addAll(new Node[]{pane});
        textGroup.setRz(180.0);
        textGroup.setRx(270.0);
        textGroup.setRy(45.0);
        textGroup.setTy(11.0);
        textGroup.setTz(40.0);
        graphicsGroup.getChildren().add(textGroup);
        return graphicsGroup;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "previewCard=" + this.previewCard + '}';
    }
}

