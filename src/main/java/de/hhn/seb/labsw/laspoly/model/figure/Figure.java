/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.animation.Animation
 *  javafx.animation.ParallelTransition
 *  javafx.animation.TranslateTransition
 *  javafx.beans.value.ChangeListener
 *  javafx.event.ActionEvent
 *  javafx.event.Event
 *  javafx.event.EventHandler
 *  javafx.scene.DepthTest
 *  javafx.scene.Node
 *  javafx.util.Duration
 */
package de.hhn.seb.labsw.laspoly.model.figure;

import de.hhn.seb.labsw.laspoly.exception.InvalidConditionException;
import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.field.Field;
import de.hhn.seb.labsw.laspoly.model.field.TrainStation;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.Casino;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.FreeParkingField;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.GoToPrisonField;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.Prison;
import de.hhn.seb.labsw.laspoly.model.field.specialfield.StartField;
import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.utils.audio.Sound;
import de.hhn.seb.labsw.laspoly.view.View;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.parts.Board;
import de.hhn.seb.labsw.laspoly.view.paint.Drawable;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;
import javafx.animation.Animation;
import javafx.animation.ParallelTransition;
import javafx.animation.TranslateTransition;
import javafx.beans.value.ChangeListener;
import javafx.event.ActionEvent;
import javafx.event.Event;
import javafx.event.EventHandler;
import javafx.scene.DepthTest;
import javafx.scene.Node;
import javafx.util.Duration;

public class Figure
implements Drawable {
    private final User user;
    private final EnhancedGroup figureGroup;
    private final List<ChangeListener<EnhancedGroup>> listeners;
    private EnhancedGroup view;
    private Field field;
    private int nextRow;
    private EventHandler indicatorListener;
    private Consumer<Boolean> onMouseHoverAction;
    private Field oldField;

    public Figure(User figureUser, EnhancedGroup form) {
        this.user = figureUser;
        this.nextRow = 0;
        this.oldField = null;
        this.view = form;
        this.figureGroup = new EnhancedGroup();
        this.listeners = new ArrayList<ChangeListener<EnhancedGroup>>();
        this.figureGroup.getChildren().add(this.view);
        this.figureGroup.setDepthTest(DepthTest.ENABLE);
        this.figureGroup.setTranslateY(10.0);
        this.figureGroup.setOnMouseEntered(e -> this.onHoverStart());
        this.figureGroup.setOnMouseExited(e -> this.onHoverEnd());
    }

    public User getUser() {
        return this.user;
    }

    public EnhancedGroup getFigureGroup() {
        return this.figureGroup;
    }

    public EnhancedGroup getFigureForm() {
        return this.view;
    }

    public void setFigureForm(EnhancedGroup figureForm) {
        this.view = figureForm;
        this.view.setScale(9.0);
        for (ChangeListener<EnhancedGroup> v : this.listeners) {
            v.changed(null, this.view, figureForm);
        }
    }

    public void placeFigure(Field fieldOfFigure, EventHandler playerIndicatorListener, AfterPositioningRunner runCode, FigureAnimation animation) {
        this.indicatorListener = playerIndicatorListener;
        this.placeFigure(fieldOfFigure, runCode, animation);
    }

    public void placeFigure(Field fieldOfFigure, AfterPositioningRunner runCode, FigureAnimation animation) {
        if (this.field != null) {
            this.oldField = this.field;
            this.field.getFigureList().remove(this);
            int oldFieldFigureCount = this.field.getFigureList().size();
            if (oldFieldFigureCount == 1) {
                this.field.getFigureList().get(0).updatePosition(View.FigurePositions.TOP_LEFT, false, () -> {}, FigureAnimation.ANIM_DRAW);
            } else if (oldFieldFigureCount == 2) {
                this.field.getFigureList().get(0).updatePosition(View.FigurePositions.TOP_LEFT, false, () -> {}, FigureAnimation.ANIM_DRAW);
                this.field.getFigureList().get(1).updatePosition(View.FigurePositions.BOTTOM_RIGHT, false, () -> {}, FigureAnimation.ANIM_DRAW);
            } else if (oldFieldFigureCount == 3) {
                this.field.getFigureList().get(0).updatePosition(View.FigurePositions.TOP_LEFT, false, () -> {}, FigureAnimation.ANIM_DRAW);
                this.field.getFigureList().get(1).updatePosition(View.FigurePositions.TOP_RIGHT, false, () -> {}, FigureAnimation.ANIM_DRAW);
                this.field.getFigureList().get(2).updatePosition(View.FigurePositions.BOTTOM_LEFT, false, () -> {}, FigureAnimation.ANIM_DRAW);
            }
        }
        this.field = fieldOfFigure;
        this.field.getFigureList().add(this);
        int figureCount = fieldOfFigure.getFigureList().size();
        if (figureCount == 1) {
            fieldOfFigure.getFigureList().get(0).updatePosition(View.FigurePositions.TOP_LEFT, true, runCode, animation);
        } else if (figureCount == 2) {
            fieldOfFigure.getFigureList().get(0).updatePosition(View.FigurePositions.TOP_LEFT, false, () -> {}, FigureAnimation.ANIM_DRAW);
            fieldOfFigure.getFigureList().get(1).updatePosition(View.FigurePositions.TOP_RIGHT, true, runCode, animation);
        } else if (figureCount == 3) {
            fieldOfFigure.getFigureList().get(0).updatePosition(View.FigurePositions.TOP_LEFT, false, () -> {}, FigureAnimation.ANIM_DRAW);
            fieldOfFigure.getFigureList().get(1).updatePosition(View.FigurePositions.TOP_RIGHT, false, () -> {}, FigureAnimation.ANIM_DRAW);
            fieldOfFigure.getFigureList().get(2).updatePosition(View.FigurePositions.BOTTOM_LEFT, true, runCode, animation);
        } else if (figureCount == 4) {
            fieldOfFigure.getFigureList().get(0).updatePosition(View.FigurePositions.TOP_LEFT, false, () -> {}, FigureAnimation.ANIM_DRAW);
            fieldOfFigure.getFigureList().get(1).updatePosition(View.FigurePositions.TOP_RIGHT, false, () -> {}, FigureAnimation.ANIM_DRAW);
            fieldOfFigure.getFigureList().get(2).updatePosition(View.FigurePositions.BOTTOM_LEFT, false, () -> {}, FigureAnimation.ANIM_DRAW);
            fieldOfFigure.getFigureList().get(3).updatePosition(View.FigurePositions.BOTTOM_RIGHT, true, runCode, animation);
        }
    }

    private void updatePosition(Integer[] position, boolean moveToOtherField, AfterPositioningRunner runCode, FigureAnimation animation) {
        switch (animation) {
            case ANIM_TO_PRISON: {
                this.playToPrison(position, runCode);
                break;
            }
            case ANIM_OUT_PRISON: {
                this.playFromPrison(position, runCode);
                break;
            }
            case ANIM_DRAW: {
                this.playDrawAnimation(position, moveToOtherField, runCode);
                break;
            }
            case ANIM_TRAVEL: {
                this.playTrainAnimation(position, this.field, runCode);
                break;
            }
        }
    }

    private double getInitialX(Field fieldOfFigure) {
        int pos = fieldOfFigure.getPosition();
        double fieldTransX = Board.getFieldOffsetX(pos);
        if (pos == 0 || pos == 30) {
            return fieldTransX - 25.0;
        }
        if (pos == 10) {
            return fieldTransX + 25.0;
        }
        return fieldTransX;
    }

    private double getInitialZ(Field fieldOfFigure) {
        int pos = fieldOfFigure.getPosition();
        double fieldTransZ = Board.getFieldOffsetZ(pos);
        if (pos == 20) {
            return fieldTransZ + 25.0;
        }
        return fieldTransZ;
    }

    public void playTrainAnimation(Integer[] position, Field trainField, AfterPositioningRunner runCode) {
        TranslateTransition translateTransition;
        if (trainField instanceof TrainStation) {
            translateTransition = new TranslateTransition(Duration.millis((double)800.0), (Node)this.figureGroup);
            if (this.oldField.getRow() == 0) {
                translateTransition.setFromZ(this.figureGroup.getTranslateZ());
                translateTransition.setToZ(this.figureGroup.getTranslateZ() - (double)position[1].intValue() + 115.0);
            } else if (this.oldField.getRow() == 1) {
                translateTransition.setFromX(this.figureGroup.getTranslateX());
                translateTransition.setToX(this.figureGroup.getTranslateX() - (double)position[0].intValue() - 115.0);
            } else if (this.oldField.getRow() == 2) {
                translateTransition.setFromZ(this.figureGroup.getTranslateZ());
                translateTransition.setToZ(this.figureGroup.getTranslateZ() - (double)position[1].intValue() - 115.0);
            } else if (this.oldField.getRow() == 3) {
                translateTransition.setFromX(this.figureGroup.getTranslateX());
                translateTransition.setToX(this.figureGroup.getTranslateX() - (double)position[0].intValue() + 115.0);
            }
        } else {
            throw new InvalidConditionException("The given field was not a Train Station.");
        }
        this.nextRow = trainField.getRow();
        translateTransition.play();
        translateTransition.setOnFinished(event -> {
            TranslateTransition translateTransitionY = new TranslateTransition(Duration.millis((double)400.0), (Node)this.figureGroup);
            translateTransitionY.setFromY(this.figureGroup.getTranslateY());
            translateTransitionY.setToY(this.figureGroup.getTranslateY() - 250.0);
            translateTransitionY.play();
            translateTransitionY.setOnFinished(event1 -> {
                TranslateTransition translateNextTrainstation = new TranslateTransition(Duration.millis((double)600.0), (Node)this.figureGroup);
                translateNextTrainstation.setFromX(this.figureGroup.getTranslateX());
                translateNextTrainstation.setFromZ(this.figureGroup.getTranslateZ());
                if (trainField.getRow() == 0) {
                    translateNextTrainstation.setToZ(Board.getFieldOffsetZ(trainField.getPosition()) + 100.0);
                    translateNextTrainstation.setToX(Board.getFieldOffsetX(trainField.getPosition()));
                } else if (trainField.getRow() == 1) {
                    translateNextTrainstation.setToX(Board.getFieldOffsetX(trainField.getPosition()) - 100.0);
                    translateNextTrainstation.setToZ(Board.getFieldOffsetZ(trainField.getPosition()));
                } else if (trainField.getRow() == 2) {
                    translateNextTrainstation.setToZ(Board.getFieldOffsetZ(trainField.getPosition()) - 100.0);
                    translateNextTrainstation.setToX(Board.getFieldOffsetX(trainField.getPosition()));
                } else if (trainField.getRow() == 3) {
                    translateNextTrainstation.setToX(Board.getFieldOffsetX(trainField.getPosition()) + 100.0);
                    translateNextTrainstation.setToZ(Board.getFieldOffsetZ(trainField.getPosition()));
                }
                translateNextTrainstation.play();
                translateNextTrainstation.setOnFinished(event2 -> {
                    TranslateTransition translateYBack = new TranslateTransition(Duration.millis((double)400.0), (Node)this.figureGroup);
                    translateYBack.setFromY(this.figureGroup.getTranslateY());
                    translateTransitionY.setToY(10.0);
                    translateTransitionY.play();
                    translateTransitionY.setOnFinished(event3 -> {
                        TranslateTransition translateToFieldPosition = new TranslateTransition(Duration.millis((double)1000.0), (Node)this.figureGroup);
                        translateToFieldPosition.setFromX(this.figureGroup.getTranslateX());
                        translateToFieldPosition.setToX((double)position[0].intValue() + Board.getFieldOffsetX(trainField.getPosition()));
                        translateToFieldPosition.setFromZ(this.figureGroup.getTranslateZ());
                        translateToFieldPosition.setToZ((double)position[1].intValue() + Board.getFieldOffsetZ(trainField.getPosition()));
                        translateToFieldPosition.play();
                        translateToFieldPosition.setOnFinished(event4 -> {
                            runCode.run();
                            if (this.indicatorListener != null) {
                                this.indicatorListener.handle((Event)new ActionEvent());
                                this.indicatorListener = null;
                            }
                        });
                    });
                });
            });
        });
    }

    private void playDrawAnimation(Integer[] position, boolean moveToOtherField, AfterPositioningRunner runCode) {
        int row = this.field.getRow();
        boolean before = false;
        if (this.oldField != null) {
            boolean bl = before = this.oldField.getPosition() >= this.field.getPosition();
        }
        if (this.nextRow == row && !before || !moveToOtherField) {
            if (this.nextRow == 0 || this.nextRow == 2) {
                this.playMoveXFirst(position, runCode);
            } else if (this.nextRow == 1 || this.nextRow == 3) {
                this.playMoveZFirst(position, runCode);
            }
        } else if (this.nextRow == 0) {
            this.moveToField(FreeParkingField.getField(), position, runCode);
        } else if (this.nextRow == 1) {
            this.moveToField(Casino.getField(), position, runCode);
        } else if (this.nextRow == 2) {
            this.moveToField(GoToPrisonField.getField(), position, runCode);
        } else if (this.nextRow == 3) {
            this.moveToField(StartField.getField(), position, runCode);
        }
    }

    private void moveToField(Field nextField, Integer[] position, AfterPositioningRunner runCode) {
        this.oldField = nextField;
        TranslateTransition translateTransition = new TranslateTransition(Duration.millis((double)2000.0), (Node)this.figureGroup);
        translateTransition.setFromX(this.figureGroup.getTranslateX());
        translateTransition.setFromZ(this.figureGroup.getTranslateZ());
        translateTransition.setToX(this.getInitialX(nextField) + (double)position[0].intValue());
        translateTransition.setToZ(this.getInitialZ(nextField) + (double)position[1].intValue());
        translateTransition.play();
        translateTransition.setOnFinished(event -> {
            if (nextField instanceof StartField) {
                this.nextRow = 0;
            } else if (nextField instanceof FreeParkingField) {
                this.nextRow = 1;
            } else if (nextField instanceof Casino) {
                this.nextRow = 2;
            } else if (nextField instanceof GoToPrisonField) {
                this.nextRow = 3;
            } else if (nextField instanceof Prison) {
                this.nextRow = 0;
            }
            if (this.field.equals(nextField)) {
                runCode.run();
                if (this.indicatorListener != null) {
                    this.indicatorListener.handle((Event)new ActionEvent());
                    this.indicatorListener = null;
                }
            } else {
                this.playDrawAnimation(position, true, runCode);
            }
        });
    }

    private void playMoveZFirst(Integer[] position, AfterPositioningRunner runCode) {
        TranslateTransition translate = new TranslateTransition(Duration.millis((double)1000.0), (Node)this.figureGroup);
        translate.setFromZ(this.figureGroup.getTranslateZ());
        translate.setToZ(this.getInitialZ(this.field) + (double)position[1].intValue());
        translate.play();
        translate.setOnFinished(event -> {
            TranslateTransition translate1 = new TranslateTransition(Duration.millis((double)100.0), (Node)this.figureGroup);
            translate1.setFromX(this.figureGroup.getTranslateX());
            translate1.setToX(this.getInitialX(this.field) + (double)position[0].intValue());
            translate1.play();
            runCode.run();
            if (this.indicatorListener != null) {
                this.indicatorListener.handle((Event)new ActionEvent());
                this.indicatorListener = null;
            }
        });
    }

    private void playMoveXFirst(Integer[] position, AfterPositioningRunner runCode) {
        TranslateTransition translate = new TranslateTransition(Duration.millis((double)1000.0), (Node)this.figureGroup);
        translate.setFromX(this.figureGroup.getTranslateX());
        translate.setToX(this.getInitialX(this.field) + (double)position[0].intValue());
        translate.play();
        translate.setOnFinished(event -> {
            TranslateTransition translate1 = new TranslateTransition(Duration.millis((double)100.0), (Node)this.figureGroup);
            translate1.setFromZ(this.figureGroup.getTranslateZ());
            translate1.setToZ(this.getInitialZ(this.field) + (double)position[1].intValue());
            translate1.play();
            runCode.run();
            if (this.indicatorListener != null) {
                this.indicatorListener.handle((Event)new ActionEvent());
                this.indicatorListener = null;
            }
        });
    }

    private void playToPrison(Integer[] position, AfterPositioningRunner runCode) {
        TranslateTransition translateTransitionY = new TranslateTransition(Duration.millis((double)2000.0), (Node)this.figureGroup);
        translateTransitionY.setFromY(10.0);
        translateTransitionY.setToY(350.0);
        Sound.ANNOYINGSIREN.play();
        translateTransitionY.play();
        translateTransitionY.setOnFinished(event -> {
            TranslateTransition translateTransitionX = new TranslateTransition(Duration.millis((double)1000.0), (Node)this.figureGroup);
            translateTransitionX.setFromX(this.figureGroup.getTranslateX());
            translateTransitionX.setToX(Board.getFieldOffsetX(40) + (double)position[0].intValue());
            TranslateTransition translateTransitionZ = new TranslateTransition(Duration.millis((double)1000.0), (Node)this.figureGroup);
            translateTransitionZ.setFromZ(this.figureGroup.getTranslateZ());
            translateTransitionZ.setToZ(Board.getFieldOffsetZ(40) + (double)position[1].intValue());
            ParallelTransition parallelTransition = new ParallelTransition(new Animation[]{translateTransitionX, translateTransitionZ});
            parallelTransition.play();
            parallelTransition.setOnFinished(ev -> {
                TranslateTransition translateTransitionY1 = new TranslateTransition(Duration.millis((double)1000.0), (Node)this.figureGroup);
                translateTransitionY1.setFromY(350.0);
                translateTransitionY1.setToY(0.0);
                translateTransitionY1.play();
                translateTransitionY1.setOnFinished(e -> {
                    runCode.run();
                    if (this.indicatorListener != null) {
                        this.indicatorListener.handle((Event)new ActionEvent());
                        this.indicatorListener = null;
                    }
                });
            });
        });
    }

    private void playFromPrison(Integer[] position, AfterPositioningRunner runCode) {
        TranslateTransition translateTransitionOY = new TranslateTransition(Duration.millis((double)2000.0), (Node)this.figureGroup);
        translateTransitionOY.setFromY(2.0);
        translateTransitionOY.setToY(350.0);
        translateTransitionOY.play();
        translateTransitionOY.setOnFinished(event -> {
            TranslateTransition translateTransitionX = new TranslateTransition(Duration.millis((double)1000.0), (Node)this.figureGroup);
            translateTransitionX.setFromX(this.getFigureForm().getTranslateX());
            translateTransitionX.setToX(Board.getFieldOffsetX(0) + (double)position[0].intValue());
            TranslateTransition translateTransitionZ = new TranslateTransition(Duration.millis((double)1000.0), (Node)this.figureGroup);
            translateTransitionZ.setFromZ((double)position[1].intValue());
            translateTransitionZ.setToZ(Board.getFieldOffsetZ(0) + (double)position[1].intValue());
            ParallelTransition parallelTransition = new ParallelTransition(new Animation[]{translateTransitionX, translateTransitionZ});
            parallelTransition.play();
            parallelTransition.setOnFinished(event1 -> {
                TranslateTransition translateTransitionY = new TranslateTransition(Duration.millis((double)1000.0), (Node)this.figureGroup);
                translateTransitionY.setFromY(350.0);
                translateTransitionY.setToY(10.0);
                translateTransitionY.play();
                translateTransitionY.setOnFinished(e -> {
                    runCode.run();
                    if (this.indicatorListener != null) {
                        this.indicatorListener.handle((Event)new ActionEvent());
                        this.indicatorListener = null;
                    }
                });
            });
        });
    }

    @Override
    public Node draw() {
        return this.figureGroup;
    }

    public void setOnMouseHover(Consumer<Boolean> consumer) {
        this.onMouseHoverAction = consumer;
    }

    private void onHoverStart() {
        if (this.onMouseHoverAction != null) {
            this.onMouseHoverAction.accept(true);
        }
    }

    private void onHoverEnd() {
        if (this.onMouseHoverAction != null) {
            this.onMouseHoverAction.accept(false);
        }
    }

    public void addOnMeshChangedListener(ChangeListener<EnhancedGroup> changeListener) {
        this.listeners.add(changeListener);
    }

    public void removeOnMeshChangedListener(ChangeListener<EnhancedGroup> changeListener) {
        this.listeners.remove(changeListener);
    }

    public Field getField() {
        return this.field;
    }

    public void setNextRow(int row) {
        this.nextRow = row;
    }

    public static interface AfterPositioningRunner {
        public void run();
    }

    public static enum FigureAnimation {
        ANIM_TO_PRISON,
        ANIM_OUT_PRISON,
        ANIM_TRAVEL,
        ANIM_DRAW;

    }
}

