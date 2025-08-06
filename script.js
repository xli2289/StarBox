class SmartSchedule {
    constructor() {
        this.courses = JSON.parse(localStorage.getItem('courses')) || [];
        this.rewards = JSON.parse(localStorage.getItem('rewards')) || [];
        this.history = JSON.parse(localStorage.getItem('history')) || [];
        this.totalPoints = parseInt(localStorage.getItem('totalPoints')) || 0;
        this.longPressTimer = null;
        this.pressingCourseId = null;
        
        this.init();
    }
    
    init() {
        this.render();
        this.bindEvents();
    }
    
    render() {
        this.renderCourses();
        this.renderRewards();
        this.renderHistory();
        this.updatePointsDisplay();
    }
    
    bindEvents() {
        // Tab切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // 添加课程按钮
        document.getElementById('add-course-btn').addEventListener('click', () => {
            this.openCourseModal();
        });
        
        // 添加批量创建课程按钮
        document.getElementById('batch-add-course-btn').addEventListener('click', () => {
            this.openBatchCourseModal();
        });
        
        // 课程表单提交
        document.getElementById('course-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCourse();
        });
        
        // 批量课程表单提交
        document.getElementById('batch-course-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addBatchCourses();
        });
        
        // 添加奖励按钮
        document.getElementById('add-reward-btn').addEventListener('click', () => {
            this.openRewardModal();
        });
        
        // 奖励表单提交
        document.getElementById('reward-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveReward();
        });
        
        // 模态框关闭
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });
        
        // 长按操作按钮事件
        document.getElementById('edit-course-btn').addEventListener('click', () => {
            if (this.pressingCourseId) {
                const course = this.courses.find(course => course.id === this.pressingCourseId);
                this.hideLongPressModal();
                this.openCourseModal(course);
            }
        });
        
        document.getElementById('delete-course-btn').addEventListener('click', () => {
            if (this.pressingCourseId) {
                const course = this.courses.find(course => course.id === this.pressingCourseId);
                this.hideLongPressModal();
                this.showDeleteConfirmModal(course.id, course.name);
            }
        });
        
        document.getElementById('cancel-action-btn').addEventListener('click', () => {
            this.hideLongPressModal();
        });
        
        // 手动积分管理按钮
        document.getElementById('add-points-btn').addEventListener('click', () => {
            this.showPointsModal('add');
        });
        
        document.getElementById('deduct-points-btn').addEventListener('click', () => {
            this.showPointsModal('deduct');
        });
        
        // 预设颜色选择事件
        document.querySelectorAll('.preset-color').forEach(colorElement => {
            colorElement.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                document.getElementById('course-color').value = color;
            });
        });
    }
    
    switchTab(tabName) {
        // 隐藏所有tab内容
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // 移除所有tab按钮的active类
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 显示选中的tab内容
        document.getElementById(tabName).classList.add('active');
        
        // 给选中的tab按钮添加active类
        document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');
    }
    
    openCourseModal(course = null) {
        const form = document.getElementById('course-form');
        form.reset();
        
        if (course) {
            // 编辑模式
            document.getElementById('course-name').value = course.name;
            document.getElementById('course-day').value = course.day;
            document.getElementById('start-time').value = course.startTime;
            document.getElementById('end-time').value = course.endTime;
            document.getElementById('course-points').value = course.points;
            document.getElementById('course-color').value = course.color;
            
            // 添加隐藏字段存储课程ID
            let courseIdInput = document.getElementById('course-id');
            if (!courseIdInput) {
                courseIdInput = document.createElement('input');
                courseIdInput.type = 'hidden';
                courseIdInput.id = 'course-id';
                form.appendChild(courseIdInput);
            }
            courseIdInput.value = course.id;
        } else {
            // 添加模式
            const courseIdInput = document.getElementById('course-id');
            if (courseIdInput) {
                courseIdInput.remove();
            }
        }
        
        document.getElementById('course-modal').style.display = 'block';
    }
    
    openBatchCourseModal() {
        document.getElementById('batch-course-modal').style.display = 'block';
    }
    
    addCourse() {
        const name = document.getElementById('course-name').value;
        const day = document.getElementById('course-day').value;
        const startTime = document.getElementById('start-time').value;
        const endTime = document.getElementById('end-time').value;
        const points = parseInt(document.getElementById('course-points').value);
        const color = document.getElementById('course-color').value;
        const courseIdInput = document.getElementById('course-id');
        
        if (courseIdInput && courseIdInput.value) {
            // 编辑现有课程
            const id = parseInt(courseIdInput.value);
            const courseIndex = this.courses.findIndex(course => course.id === id);
            if (courseIndex !== -1) {
                this.courses[courseIndex] = {
                    ...this.courses[courseIndex],
                    name,
                    day,
                    startTime,
                    endTime,
                    points,
                    color
                };
            }
        } else {
            // 添加新课程
            const course = {
                id: Date.now(),
                name,
                day,
                startTime,
                endTime,
                points,
                color,
                completed: false
            };
            this.courses.push(course);
        }
        
        this.saveData();
        this.renderCourses();
        
        // 关闭模态框
        document.getElementById('course-modal').style.display = 'none';
    }
    
    addBatchCourses() {
        const batchData = document.getElementById('batch-course-data').value;
        if (!batchData) {
            alert('请输入课程数据');
            return;
        }
        
        try {
            const courses = JSON.parse(batchData);
            if (!Array.isArray(courses)) {
                alert('数据格式错误，请提供课程数组');
                return;
            }
            
            let addedCount = 0;
            courses.forEach(course => {
                // 验证必要字段
                if (course.name && course.day && course.startTime && course.endTime && course.points && course.color) {
                    this.courses.push({
                        id: Date.now() + addedCount, // 确保ID唯一
                        name: course.name,
                        day: course.day,
                        startTime: course.startTime,
                        endTime: course.endTime,
                        points: course.points,
                        color: course.color,
                        completed: false
                    });
                    addedCount++;
                }
            });
            
            this.saveData();
            this.renderCourses();
            
            alert(`成功添加 ${addedCount} 个课程`);
            document.getElementById('batch-course-modal').style.display = 'none';
            document.getElementById('batch-course-form').reset();
        } catch (e) {
            alert('JSON格式错误: ' + e.message);
        }
    }
    
    deleteCourse(id) {
        this.courses = this.courses.filter(course => course.id !== id);
        this.saveData();
        this.renderCourses();
    }
    
    showLongPressModal(courseId, courseName) {
        this.pressingCourseId = courseId;
        document.getElementById('action-course-name').textContent = courseName;
        document.getElementById('long-press-modal').style.display = 'block';
    }
    
    // 新增删除确认弹窗
    showDeleteConfirmModal(courseId, courseName) {
        this.pressingCourseId = courseId;
        if (confirm(`确定要删除课程 "${courseName}" 吗？`)) {
            this.deleteCourse(courseId);
        }
    }
    
    hideLongPressModal() {
        document.getElementById('long-press-modal').style.display = 'none';
        this.pressingCourseId = null;
    }
    
    completeCourse(id) {
        const course = this.courses.find(course => course.id === id);
        if (course) {
            this.totalPoints += course.points;
            
            // 添加到历史记录
            this.history.push({
                id: Date.now(),
                type: 'course',
                courseId: course.id,
                description: `完成课程: ${course.name}`,
                points: course.points,
                date: new Date().toISOString()
            });
            
            this.saveData();
            this.render();
            
            // 弹窗提示获取积分
            alert(`恭喜你完成了课程 "${course.name}"！获得了 ${course.points} 积分！`);
        }
    }
    
    renderCourses() {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        days.forEach(day => {
            const container = document.querySelector(`.day-content[data-day="${day}"]`);
            container.innerHTML = '';
            
            const dayCourses = this.courses
                .filter(course => course.day === day)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
            
            dayCourses.forEach(course => {
                const courseElement = document.createElement('div');
                courseElement.className = `course-card ${course.completed ? 'completed' : ''}`;
                courseElement.style.backgroundColor = course.color;
                courseElement.innerHTML = `
                    <h3>${course.name}</h3>
                    <div class="course-time">${course.startTime} - ${course.endTime}</div>
                    <div class="course-points">${course.points} 积分</div>
                `;
                
                // 添加长按事件监听
                let pressTimer;
                
                courseElement.addEventListener('mousedown', (e) => {
                    pressTimer = setTimeout(() => {
                        this.showLongPressModal(course.id, course.name);
                    }, 500); // 长按500ms触发
                });
                
                courseElement.addEventListener('mouseup', () => {
                    clearTimeout(pressTimer);
                });
                
                courseElement.addEventListener('mouseleave', () => {
                    clearTimeout(pressTimer);
                });
                
                // 移动端触摸事件
                courseElement.addEventListener('touchstart', (e) => {
                    pressTimer = setTimeout(() => {
                        this.showLongPressModal(course.id, course.name);
                    }, 500);
                });
                
                courseElement.addEventListener('touchend', () => {
                    clearTimeout(pressTimer);
                });
                
                courseElement.addEventListener('touchcancel', () => {
                    clearTimeout(pressTimer);
                });
                
                courseElement.addEventListener('click', (e) => {
                    // 防止长按后触发点击事件
                    if (e.detail === 1) { // 确保是单击而不是双击
                        clearTimeout(pressTimer);
                        this.completeCourse(course.id);
                    }
                });
                
                container.appendChild(courseElement);
            });
        });
    }
    
    openRewardModal(reward = null) {
        const modal = document.getElementById('reward-modal');
        const title = document.getElementById('reward-modal-title');
        const form = document.getElementById('reward-form');
        
        if (reward) {
            // 编辑模式
            title.textContent = '编辑奖励';
            document.getElementById('reward-id').value = reward.id;
            document.getElementById('reward-name').value = reward.name;
            document.getElementById('reward-cost').value = reward.cost;
        } else {
            // 添加模式
            title.textContent = '添加奖励';
            form.reset();
            document.getElementById('reward-id').value = '';
        }
        
        modal.style.display = 'block';
    }
    
    saveReward() {
        const id = document.getElementById('reward-id').value;
        const name = document.getElementById('reward-name').value;
        const cost = parseInt(document.getElementById('reward-cost').value);
        
        if (id) {
            // 编辑现有奖励
            const reward = this.rewards.find(r => r.id == id);
            if (reward) {
                reward.name = name;
                reward.cost = cost;
            }
        } else {
            // 添加新奖励
            this.rewards.push({
                id: Date.now(),
                name,
                cost
            });
        }
        
        this.saveData();
        this.renderRewards();
        
        // 关闭模态框
        document.getElementById('reward-modal').style.display = 'none';
    }
    
    deleteReward(id) {
        if (confirm('确定要删除这个奖励吗？')) {
            this.rewards = this.rewards.filter(reward => reward.id !== id);
            this.saveData();
            this.renderRewards();
        }
    }
    
    exchangeReward(id) {
        const reward = this.rewards.find(r => r.id === id);
        if (reward) {
            if (this.totalPoints >= reward.cost) {
                // 添加确认提示
                if (confirm(`确定要兑换 "${reward.name}" 吗？这将消耗 ${reward.cost} 积分。`)) {
                    this.totalPoints -= reward.cost;
                    
                    // 添加到历史记录
                    this.history.push({
                        id: Date.now(),
                        type: 'reward',
                        rewardId: reward.id,
                        description: `兑换奖励: ${reward.name}`,
                        points: -reward.cost,
                        date: new Date().toISOString()
                    });
                    
                    this.saveData();
                    this.render();
                    
                    alert(`成功兑换: ${reward.name}`);
                }
            } else {
                alert('积分不足，无法兑换该奖励！');
            }
        }
    }
    
    renderRewards() {
        const container = document.getElementById('rewards-list');
        container.innerHTML = '';
        
        this.rewards.forEach(reward => {
            const rewardElement = document.createElement('div');
            rewardElement.className = 'reward-card';
            rewardElement.innerHTML = `
                <h3>${reward.name}</h3>
                <div class="reward-cost">${reward.cost} 积分</div>
                <div class="reward-actions">
                    <button class="reward-btn edit-btn" data-id="${reward.id}">编辑</button>
                    <button class="reward-btn delete-reward-btn" data-id="${reward.id}">删除</button>
                    <button class="reward-btn exchange-btn" data-id="${reward.id}">兑换</button>
                </div>
            `;
            
            rewardElement.querySelector('.edit-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.openRewardModal(reward);
            });

            
            rewardElement.querySelector('.delete-reward-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteReward(reward.id);
            });
                        
            rewardElement.querySelector('.exchange-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.exchangeReward(reward.id);
            });
            container.appendChild(rewardElement);
        });
    }
    
    renderHistory() {
        const container = document.getElementById('history-list');
        container.innerHTML = '';
        
        // 按时间倒序排列
        const sortedHistory = [...this.history].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (sortedHistory.length === 0) {
            container.innerHTML = '<p>暂无历史记录</p>';
            return;
        }
        
        sortedHistory.forEach(record => {
            const date = new Date(record.date);
            const dateString = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            
            const historyElement = document.createElement('div');
            historyElement.className = 'history-item';
            historyElement.innerHTML = `
                <div class="history-date">${dateString}</div>
                <div class="history-description">${record.description}</div>
                <div class="history-points">${record.points > 0 ? '+' : ''}${record.points} 积分</div>
            `;
            
            container.appendChild(historyElement);
        });
    }
    
    updatePointsDisplay() {
        document.getElementById('total-points').textContent = this.totalPoints;
    }
    
    // 增加积分
    addPoints(points, reason = '手动增加积分') {
        this.totalPoints += points;
        this.addHistoryRecord(reason, points);
        this.saveData();
        this.render();
    }
    
    // 减少积分（确保不低于0）
    deductPoints(points, reason = '手动扣除积分') {
        this.totalPoints = Math.max(0, this.totalPoints - points);
        this.addHistoryRecord(reason, -points);
        this.saveData();
        this.render();
    }
    
    // 添加历史记录
    addHistoryRecord(description, pointsChange) {
        this.history.push({
            id: Date.now(),
            type: 'points',
            description: description,
            points: pointsChange,
            date: new Date().toISOString()
        });
    }
    
    // 显示积分操作模态框
    showPointsModal(type) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'points-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>${type === 'add' ? '增加积分' : '扣除积分'}</h2>
                <form id="points-form">
                    <div class="form-group">
                        <label for="points-amount">积分数量:</label>
                        <input type="number" id="points-amount" min="1" required>
                    </div>
                    <div class="form-group">
                        <label for="points-reason">原因 (可选):</label>
                        <input type="text" id="points-reason" placeholder="例如：完成任务、购买物品等">
                    </div>
                    <button type="submit">${type === 'add' ? '增加' : '扣除'}</button>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定关闭事件
        modal.querySelector('.close').onclick = () => {
            document.body.removeChild(modal);
        };
        
        // 绑定表单提交事件
        modal.querySelector('#points-form').onsubmit = (e) => {
            e.preventDefault();
            const amount = parseInt(document.getElementById('points-amount').value);
            const reason = document.getElementById('points-reason').value || 
                          (type === 'add' ? '手动增加积分' : '手动扣除积分');
            
            if (amount > 0) {
                if (type === 'add') {
                    this.addPoints(amount, reason);
                } else {
                    this.deductPoints(amount, reason);
                }
                
                document.body.removeChild(modal);
            }
        };
        
        modal.style.display = 'block';
    }
    
    saveData() {
        localStorage.setItem('courses', JSON.stringify(this.courses));
        localStorage.setItem('rewards', JSON.stringify(this.rewards));
        localStorage.setItem('history', JSON.stringify(this.history));
        localStorage.setItem('totalPoints', this.totalPoints.toString());
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new SmartSchedule();
});