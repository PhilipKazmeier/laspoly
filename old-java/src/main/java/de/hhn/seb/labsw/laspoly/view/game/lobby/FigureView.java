/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.view.game.lobby;

import de.hhn.seb.labsw.laspoly.model.figure.Figure;
import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import java.util.Timer;
import javafx.animation.Interpolator;
import javafx.animation.Transition;
import javafx.beans.value.ChangeListener;
import javafx.scene.Camera;
import javafx.scene.Node;
import javafx.scene.Parent;
import javafx.scene.PerspectiveCamera;
import javafx.scene.SceneAntialiasing;
import javafx.scene.SubScene;
import javafx.scene.control.Tooltip;
import javafx.util.Duration;

public class FigureView {
    private static final double CAMERA_DISTANCE = 10.0;
    private final PerspectiveCamera camera;
    private final EnhancedGroup root = new EnhancedGroup();
    private final EnhancedGroup cameraEnhancedGroup;
    private final EnhancedGroup cameraEnhancedGroup2;
    private final EnhancedGroup cameraEnhancedGroup3;
    private final EnhancedGroup figureGroup;
    private final Figure figure;
    private final SubScene subScene;
    private final Timer timer;

    public FigureView(Figure fig, String toolTipText) {
        this.figure = fig;
        this.camera = new PerspectiveCamera(true);
        EnhancedGroup world = new EnhancedGroup();
        this.cameraEnhancedGroup = new EnhancedGroup();
        this.cameraEnhancedGroup2 = new EnhancedGroup();
        this.cameraEnhancedGroup3 = new EnhancedGroup();
        this.figureGroup = new EnhancedGroup();
        this.figureGroup.setTranslateY(-0.6);
        this.timer = new Timer();
        this.buildCamera();
        this.buildFigure();
        world.getChildren().addAll(new Node[]{this.figureGroup});
        this.root.getChildren().addAll(new Node[]{world});
        this.figure.addOnMeshChangedListener((ChangeListener<EnhancedGroup>)((ChangeListener)(observable, oldValue, newValue) -> this.buildFigure()));
        this.subScene = new SubScene((Parent)this.root, 100.0, 100.0, true, SceneAntialiasing.BALANCED);
        this.subScene.setCamera((Camera)this.camera);
        Tooltip t = new Tooltip(toolTipText);
        Tooltip.install((Node)this.subScene, (Tooltip)t);
    }

    private void buildCamera() {
        this.root.getChildren().add(this.cameraEnhancedGroup);
        this.cameraEnhancedGroup.getChildren().add(this.cameraEnhancedGroup2);
        this.cameraEnhancedGroup2.getChildren().add(this.cameraEnhancedGroup3);
        this.cameraEnhancedGroup3.getChildren().add(this.camera);
        this.cameraEnhancedGroup3.setRz(180.0);
        this.camera.setNearClip(0.1);
        this.camera.setFarClip(15.0);
        this.camera.setTranslateZ(-10.0);
        this.cameraEnhancedGroup.getRy().setAngle(320.0);
        this.cameraEnhancedGroup.getRx().setAngle(15.0);
    }

    private void buildFigure() {
        this.figureGroup.getChildren().clear();
        EnhancedGroup figureForm = new EnhancedGroup();
        figureForm.getChildren().add(this.figure.getFigureForm());
        this.figureGroup.getChildren().add(figureForm);
    }

    public SubScene build() {
        return this.subScene;
    }

    public void startRotation() {
        Transition rotateTransition = new Transition(50.0){
            {
                this.setInterpolator(Interpolator.LINEAR);
                this.setCycleDuration(Duration.INDEFINITE);
            }

            protected void interpolate(double frac) {
                FigureView.this.cameraEnhancedGroup.getRy().setAngle(FigureView.this.cameraEnhancedGroup.getRy().getAngle() % 360.0 - 0.72);
            }
        };
        rotateTransition.play();
    }

    public void stopRotation() {
        this.timer.cancel();
    }

    public Figure getFigure() {
        return this.figure;
    }
}
